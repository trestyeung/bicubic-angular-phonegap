//v1.0.1
angular.module('bicubic.mobileCamera', [])
    .directive('bcMobileCamera', ['$timeout', '$rootScope', '$compile', function ($timeout, $rootScope, $compile) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                imageUri: '=',
                imageDataUri: '=',
                takeFromCameraText: '@',
                takeFromLibraryText: '@',
                cancelText: '@'
            },
            link: function ($scope, $element) {

                if(!_.hasDeep(navigator,'camera.getPicture')){
                    console.warn('Phonegap Camera Plugin Not installed')
                }

                //menu template here, attach to doc
                var options = {
                    menuId: _.uid() || 'menu',
                    takeFromCameraText: $scope.takeFromCameraText || 'Take from camera',
                    takeFromLibraryText: $scope.takeFromLibraryText || 'Take from library',
                    cancelText: $scope.cancelText || 'Cancel'
                };

                //create menu
                var template =
                    '<div>' +
                    '<div class="before-animation pushToGpu sc-transition blackout" id="' + options.menuId + '-blackout"></div>' +
                    '<div class="mobileMenu before-animation pushToGpu sc-transition" id="' + options.menuId + '-menu">' +
                    '<ul>' +
                    '<li class="clickable-background-black"  id="' + options.menuId + '-camera-button">' +
                    '<a>' + options.takeFromCameraText + '</a>' +
                    '</li>' +
                    '<li class="clickable-background-black" id="' + options.menuId + '-library-button">' +
                    '<a>' + options.takeFromLibraryText + '</a>' +
                    '</li>' +
                    '</ul>' +
                    '<ul>' +
                    '<li class="clickable-background-black" id="' + options.menuId + '-close" >' +
                    '<a>' + options.cancelText + '</a>' +
                    '</li>' +
                    '</ul>' +
                    '</div>' +
                    '</div>';

                var e = $compile(template)($scope);
                $('body').append(e);

                var cameraMenuOverlayEl, cameraMenuElement, cameraButton, libraryButton;

                var toggleMenu = function (callback) {
                    if (_.size(cameraMenuElement) === 0) return;
                    Wdo.animateTranslate(cameraMenuElement, '-100px', true, true, callback);
                    Wdo.animateFade(cameraMenuOverlayEl);
                };

                //functions
                function takePictureFromCamera() {
                    toggleMenu(function () {
                        navigator.camera.getPicture(
                            pictureTaken,
                            function (message) {
                                $rootScope.$apply(function () {
                                    $timeout(function () {
                                        $window.alert('PictureTaken 401' + message);
                                    }, 0, false);
                                });
                            },
                            {
                                quality: 70,
                                targetWidth: 1024,
                                targetHeight: 1024,
                                destinationType: navigator.camera.DestinationType.FILE_URI,
                                sourceType: navigator.camera.PictureSourceType.CAMERA,
                                correctOrientation: true
                            });
                    });
                }

                function takePictureFromLibrary() {
                    toggleMenu(function () {
                        navigator.camera.getPicture(
                            pictureTaken,
                            function (message) {
                                $rootScope.$apply(function () {
                                    console.log('takefromlib 423 ' + message);
                                });
                            },
                            {
                                quality: 70,
                                targetWidth: 1024,
                                targetHeight: 1024,
                                destinationType: navigator.camera.DestinationType.FILE_URI,
                                sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                                correctOrientation: true
                            });
                    });
                }

                function pictureTaken(imageURI) {
                    $rootScope.$apply(function () {
                        $scope.imageUri = imageURI;
                    });

                }

                $timeout(function () {

                    // UPLOAD PICTURE
                    cameraMenuOverlayEl = $('#' + options.menuId + '-blackout');
                    cameraMenuElement = $('#' + options.menuId + '-menu');
                    cameraButton = $('#' + options.menuId + '-camera-button');
                    libraryButton = $('#' + options.menuId + '-library-button');

                    //Adds the menu event handlers
                    $element.bind('touchend', toggleMenu); //#popupMenu-close
                    $('#' + options.menuId + '-close').bind('touchend', toggleMenu);
                    cameraButton.bind('touchend', takePictureFromCamera);
                    libraryButton.bind('touchend', takePictureFromLibrary);

                }, 600, false);

                $scope.$on('$destroy', function () {
                    $element.unbind('touchend', toggleMenu); //#popupMenu-close
                    $('#' + options.menuId + '-close').unbind('touchend', toggleMenu);
                    cameraButton.unbind('touchend', takePictureFromCamera);
                    libraryButton.unbind('touchend', takePictureFromLibrary);
                    cameraMenuElement = null;
                    cameraMenuOverlayEl = null;
                    cameraButton = null;
                    libraryButton = null;
                });

            }
        };
    }]);