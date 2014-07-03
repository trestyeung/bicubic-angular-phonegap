angular.module('twoHouses.services')
    .service('utilityService', ['$filter', function ($filter) {
        return {
            dateToJson: function (dateString) {
                var dt = Date.parse(dateString);
                dt.addMinutes(Math.abs(dt.getTimezoneOffset()));
                return dt.toJSON();
            }
        };
    }]);