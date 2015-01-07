//jstimezonedetect
angular.module('bicubic.networkService', [])
    .service('networkService', ['$timeout', '$filter', function ($timeout, $filter) {
        return {
            getIp: function () {
                if (window.XMLHttpRequest)
                    xmlhttp = new XMLHttpRequest();
                else
                    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");

                xmlhttp.open("GET", "http://jsonip.appspot.com/?asp.net", false);
                xmlhttp.send();

                hostipInfo = xmlhttp.responseText;
                obj = JSON.parse(hostipInfo);
                console.log(obj.ip);
                return obj.ip;
            }
        };
    }]);
