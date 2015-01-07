function BaseModalCtrl($scope, childController) {
    var _self = this;

    var $injector = angular.injector(['ng']);
    var $timeout = $injector.get('$timeout');
    var $interval = $injector.get('$interval');

    $scope.hideLoader = false;

    //Calls the closeModal
    $scope.cancel = function () {
        $scope.$modalClose();

        //Waits for animations to finish before removing this popup
        $timeout(function () {
            $scope.$destroy();
        }, 650, false);
    };

    $scope.$on('closePopups', function (event, sender) {
        $timeout(function () {
            $scope.cancel();
        }, 300, false);
    });

    $scope.$on('$destroy', function () {

    })

}

function BaseViewCtrl($scope, childController) {
    var _self = this, interval;

    this.checkView = function (viewName, templateViewName) {
        if (!viewName) throw 'View not set';
        if (viewName != templateViewName) throw 'Wrong view name';
    };


    this.events = [];

    this.addEvent = function (event) {
        this.events.push(event);
    };

    var $injector = angular.injector(['ng']);
    var $timeout = $injector.get('$timeout');
    var $interval = $injector.get('$interval');

    $scope.showContent = function (callback) {
        interval = $interval(function () {
            if (!window.isAnimating) {
                $interval.cancel(interval);
                if (callback)
                    callback.call();
            }
        }, 300);
    };

    $scope.$on('$destroy', function (e, a) {
        $interval.cancel(interval);
        _.each(_self.events, function (event) {
            event();
        })
    })
}

/**
 * @return {boolean}
 */
function CheckView(viewName, templateViewName) {
    if (!viewName) throw 'View not set';
    if (viewName != templateViewName) {
        console.log('Different view name');
        return false;
    }

    return true;


}


