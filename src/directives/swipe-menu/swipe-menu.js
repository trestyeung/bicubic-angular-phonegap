angular.module('whatido.swipeMenu', []).constant('swipeMenuConfig', {
    menuWidth: 100,
}).directive('swipemenu', [
  '$compile',
  '$timeout',
  '$q',
  'swipeMenuConfig',
  function ($compile, $timeout, $q, swipeMenuConfig) {
      var template = '<div class="ptr" style="width: 30px;background-color: red;position: absolute;right: 3px;height: 100px;width: 100px;z-index: -1;">Menu here</div>';
      return {
          restrict: 'AE',
          scope: true,
          transclude: false,
          compile: function (element, attributes) {

              //  element.parent().prepend(template); //prepend or ...        

              return function (scope, element) {
                  //var config = angular.extend({}, swipeMenuConfig, element);

                  var menuWidth = 200;

                 // element.hammer({ drag_lock_to_axis: true }).on("tap", swipeMenu);

                  $(element).on('tap', function(e) {
                      var $target = $(element);
                      openMenu($target);
                  });




                  return;
                  //not working on mobile :(

                  function swipeMenu(e) {

                      // disable browser scrolling
                      e.gesture.preventDefault();
                      var $target = $(e.currentTarget);

                      //handle hammer events
                      switch (e.type) {
                          case 'dragright':
                              setContainerOffset($target, e.gesture.deltaX);
                              break;
                          case 'dragleft':
                              setContainerOffset($target, e.gesture.deltaX);
                              break;
                          case 'tap':
                              openMenu($target);
                              e.gesture.stopDetect();
                              break;
                          case 'swiperight':
                              closeMenu($target);
                              e.gesture.stopDetect();
                              break;

                          case 'release':
                              if (Math.abs(e.gesture.deltaX) > menuWidth / 2) {
                                  if (e.gesture.direction == 'left') {
                                      openMenu($target);
                                  } else {
                                      if (e.gesture.direction == 'right') {
                                          closeMenu($target);
                                      }
                                  }
                              }
                              else {
                                  closeMenu($target);
                              }
                              break;
                      }
                  }

                  function setContainerOffset(elem, percent, animate) {
                      elem.removeClass("animate");

                      if (animate) {
                          elem.addClass("animate");
                      }

                      elem.css("transform", "translateX(" + percent + "px)");

                  }

                  function openMenu(elem) {
                      setContainerOffset(elem, -menuWidth, true);
                  }

                  function closeMenu(elem) {
                      setContainerOffset(elem, 0, true);
                  }



              };

          }
      };
  }
]);























$(function () {
});
