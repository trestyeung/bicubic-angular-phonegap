angular.module('bicubic.httpService', [])
    .factory('offlineProofHttp', [
        '$http', '$q', function ($http, $q) {

            var isOnline = true;
            if (navigator.connection) {
                isOnline = navigator.connection.type === 'ethernet' ||
                    navigator.connection.type === 'wifi' ||
                    navigator.connection.type === '2g' ||
                    navigator.connection.type === '3g' ||
                    navigator.connection.type === '4g';
            }
            else if (navigator.network && navigator.network.connection) {
                isOnline = navigator.network.connection.type === 'ethernet' ||
                    navigator.network.connection.type === 'wifi' ||
                    navigator.network.connection.type === '2g' ||
                    navigator.network.connection.type === '3g' ||
                    navigator.network.connection.type === '4g';
            } else {
                isOnline = navigator.onLine
            }

            document.addEventListener('online', onOnline, false);
            document.addEventListener('offline', onOffline, false);

            var offlineProofHttp = function (requestConfig) {

                var key, value;

                if (isOnline || requestConfig.fromStorage) {
                    return $http(requestConfig)
                        .then(function (data) {
                            if (/^GET$/i.test(requestConfig.method)) {
                                key = buildKey(requestConfig);
                                data._headers = data.headers();
                                addToStorage(key, data);
                            }
                            return data;
                        }, function (error) {
                            // TODO: do we return error or the last good data stored in localStorage ???
                            if (/^GET$/i.test(requestConfig.method)) {
                                key = buildKey(requestConfig);
                                value = getFromStorage(key);
                                if (value !== null) {
                                    return value;
                                }
                            }
                            return $q.reject(error);
                        });
                }
                else {
                    var deferred = $q.defer();
                    setTimeout(function () {
                        if (/^GET$/i.test(requestConfig.method)) {
                            key = buildKey(requestConfig);
                            value = getFromStorage(key);
                            if (value === null) {
                                deferred.reject('no data');
                            }
                            else {
                                deferred.resolve(value);
                            }
                        }
                        else {
                            deferred.reject("Unable to send the request to the server while you are offline. Please connect your device to the network.");
                        }
                    }, 1);
                    return deferred.promise;
                }
            };

            offlineProofHttp.delete = function (url, config) {
                config = angular.extend({ url: url, method: 'DELETE' }, config);
                return offlineProofHttp(config);
            };

            offlineProofHttp.get = function (url, config) {
                config = angular.extend({ url: url, method: 'GET' }, config);
                return offlineProofHttp(config);
            };

            offlineProofHttp.head = function (url, config) {
                config = angular.extend({ url: url, method: 'HEAD' }, config);
                return offlineProofHttp(config);
            };

            offlineProofHttp.jsonp = function (url, config) {
                config = angular.extend({ url: url, method: 'JSONP' }, config);
                return offlineProofHttp(config);
            };

            offlineProofHttp.post = function (url, data, config) {
                config = angular.extend({ url: url, method: 'POST', data: data }, config);
                return offlineProofHttp(config);
            };

            offlineProofHttp.put = function (url, data, config) {
                config = angular.extend({ url: url, method: 'PUT', data: data }, config);
                return offlineProofHttp(config);
            };

            return offlineProofHttp;

            function onOnline() {
                isOnline = true;
            }

            function onOffline() {
                navigator.notification.alert('No internet connection', null, 'Error', 'close');
                isOnline = false;
            }

            function buildKey(requestConfig) {
                var key = requestConfig.url;
                if (requestConfig.params) {
                    key = key + JSON.stringify(requestConfig.params);
                }
                if (requestConfig.data) {
                    key = key + JSON.stringify(requestConfig.data);
                }
                if (requestConfig.headers) {
                    key = key + JSON.stringify(requestConfig.headers);
                }
                var hash = CryptoJS.SHA3(key, { outputLength: 512 });
                return hash.toString(CryptoJS.enc.Hex);
            }

            function getFromStorage(key) {
                var obj = JSON.parse(localStorage.getItem(key));
                if (obj) {
                    addHeaderGetter(obj);
                }
                return obj;
            }

            function addToStorage(key, value) {
                localStorage.setItem(key, JSON.stringify(value));
            }

            function addHeaderGetter(response) {
                if (!response._headers) {
                    response._headers = {};
                }
                if (!response.headers) {
                    response.headers = function (name) {
                        if (!this._headers) return null;

                        if (name) {
                            return this._headers[angular.lowercase(name)] || null;
                        }

                        return this._headers;
                    };
                }
            }
        }
    ])
    .factory('formDataRequestTransform', [
        function () {

            function flatten(formData, data, prefix) {
                var value,
                    key;
                for (var prop in data) {

                    var propName = prop;

                    //Hack for 2houses => removes index in arrays
                    if (_.contains(prefix, '_ids')) {
                        if (!isNaN(prop)) {propName = ''}
                    }

                    key = typeof prefix === "undefined" ? prop : prefix + '[' + propName + ']';
                    value = data[prop];
                    if (typeof value === "object") {
                        flatten(formData, value, key);
                    }
                    else {
                        formData.append(key, value);
                    }
                }
            }

            return function (data, headersGetter) {
                var fd = new FormData();
                flatten(fd, data);

                if (headersGetter) {
                    var headers = headersGetter();
                    delete headers['Content-Type'];
                }
                return fd;
            };
        }
    ])

;
