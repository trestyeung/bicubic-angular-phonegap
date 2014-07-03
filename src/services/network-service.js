angular.module('twoHouses.services')
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
            },
            getTimezone: function () {

                //determine user timezone
                var timeZoneName = jstz.determine().name();

                var offset = new Date().getTimezoneOffset();

                var fullName = '(GMT'

                var s = Math.abs(offset / 60) + "";
                while (s.length < 2) s = "0" + s;

                if (offset < 0) {
                    fullName += '+' + s;
                } else {
                    fullName += '-' + s;
                }

                fullName += ':00) ' + timeZoneName;

                //(GMT+01:00)
                return { name: timeZoneName, offset: offset, fullName: fullName }

            }
        };
    }]);