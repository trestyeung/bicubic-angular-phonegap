function Wdo() { }
Wdo.animateTranslate = function ($elem, offset, fade, useGpu, hideTransitionEndCallBack) {

    if (!offset && offset != 0)
        offset = '100%';

    if ($elem.hasClass('before-animation')) {   //is hidden

        $elem.removeClass('before-animation'); //shows the elements

        if (useGpu)
            $elem.css('-webkit-transform', 'translate3d(0, ' + offset + ', 0)');
        else
            $elem.css('-webkit-transform', 'translateY(' + offset + ')');

        if (fade)
            $elem.css('opacity', '1', ' !important');
    }
    else {
        var transitionSucccess = false;

        $elem.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function () {
            $elem.addClass('before-animation'); //hides the elem
            $elem.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
            transitionSucccess = true;

            if (hideTransitionEndCallBack && !(hideTransitionEndCallBack instanceof jQuery.Event))
                hideTransitionEndCallBack.call();
        });

        if (useGpu)
            $elem.css('-webkit-transform', 'translate3d(0,0,0)');
        else
            $elem.css('-webkit-transform', 'translateY(0)');

        if (fade)
            $elem.css('opacity', '0', ' !important');
    }
};

Wdo.animateFade = function ($elem) {

    var transitionSucccess = false;

    if ($elem.hasClass('before-animation')) {   //is hidden
        $elem.removeClass('before-animation'); //shows the elements
        $elem.css('opacity', '1', ' !important');
    }
    else {
        $elem.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function () {
            $elem.addClass('before-animation'); //hides the elem
            $elem.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
        });

        $elem.css('opacity', '0', ' !important');
    }
};