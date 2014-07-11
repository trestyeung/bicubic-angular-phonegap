//v1.0.0
angular.module('bicubic.mobileCamera', [])
    .directive('bcMobileCamera', ['$timeout', '$rootScope', '$compile', function ($timeout, $rootScope, $compile) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                imageUri: '=',
                imageDataUri: '='
            },
            link: function ($scope, $element) {

                //menu template here, attach to doc
                var menuid = _.uid() || 'menu'; //UID here

                //create menu
                var template =
                    '<div>' +
                    '<div class="before-animation pushToGpu sc-transition blackout" id="' + menuid + '-blackout"></div>' +
                    '<div class="mobileMenu before-animation pushToGpu sc-transition" id="' + menuid + '-menu">' +
                    '<ul>' +
                    '<li class="clickable-background-black"  id="' + menuid + '-camera-button">' +
                    '<a>Prendre une photo</a>' +
                    '</li>' +
                    '<li class="clickable-background-black" id="' + menuid + '-library-button">' +
                    '<a>Bibliothèque</a>' +
                    '</li>' +
                    '</ul>' +
                    '<ul>' +
                    '<li class="clickable-background-black" id="' + menuid + '-close" >' +
                    '<a>Annuler</a>' +
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
                    cameraMenuOverlayEl = $('#' + menuid + '-blackout');
                    cameraMenuElement = $('#' + menuid + '-menu');
                    cameraButton = $('#' + menuid + '-camera-button');
                    libraryButton = $('#' + menuid + '-library-button');

                    //Adds the menu event handlers
                    $element.bind('touchend', toggleMenu); //#popupMenu-close
                    $('#' + menuid + '-close').bind('touchend',toggleMenu);
                    cameraButton.bind('touchend', takePictureFromCamera);
                    libraryButton.bind('touchend', takePictureFromLibrary);

                }, 600, false);

                $scope.$on('$destroy', function () {
                    $element.unbind('touchend', toggleMenu); //#popupMenu-close
                    $('#' + menuid + '-close').unbind('touchend', toggleMenu);
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