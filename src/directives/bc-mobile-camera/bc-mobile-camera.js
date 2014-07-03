angular.module('bicubic.mobileCamera', [])
    .directive('bcMobileCamera', ['$timeout', '$rootScope', function ($timeout, $rootScope) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                imageUri: '=',
                imageDataUri: '='
            },
            link: function ($scope, $element) {

                var cameraMenuOverlayEl, cameraMenuElement;

                var toggleMenu = function () {
                    if (!cameraMenuElement) return;
                    cameraMenuElement.css('z-index', 100001);
                    cameraMenuOverlayEl.css('z-index', 100001);
                    Wdo.animateTranslate(cameraMenuElement, '-100px', true, true);
                    Wdo.animateFade(cameraMenuOverlayEl);
                };


                $timeout(function () {

                    // UPLOAD PICTURE
                    cameraMenuOverlayEl = $('#cameraMenu-blackout');
                    cameraMenuElement = $('#cameraMenu-menu');

                    //Bind the menu
                    $rootScope.cameraMenu = [
                        {
                            active: true,
                            callback: takePictureFromCamera,
                            text: 'Prendre une photo'
                        },
                        {
                            active: false,
                            callback: takePictureFromLibrary,
                            text: 'Bibliothèque'
                        }
                    ];

                    //Adds the menu event handlers
                    $element.bind('touchend', toggleMenu); //#popupMenu-close
                    $('#cameraMenu-close').bind('touchend', toggleMenu);
                    //functions
                    function takePictureFromCamera() {
                        $timeout(function () {
                            toggleMenu();
                        }, 1000, false);
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
                    }

                    function takePictureFromLibrary() {
                        $timeout(function () {
                            toggleMenu();
                        }, 1000, false);
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
                    }

                    function pictureTaken(imageURI) {
                        $rootScope.$apply(function () {
                            $scope.imageUri = imageURI;
                        });

                    }
                }, 600, false);

                $scope.$on('$destroy', function () {
                    $element.unbind('touchend', toggleMenu); //#popupMenu-close
                    $('#cameraMenu-close').bind('touchend', toggleMenu);
                    cameraMenuElement = null;
                    cameraMenuOverlayEl = null;
                });


            }
        };
    }]);