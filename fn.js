// How to use
// 1. Upload fn.js as resource
// 2. Insert the following statement at the beginning of all .js files in all views
//    $scope.app.fn.loadResourceScript("Uploaded/fn.js")

(() =>
{
    // see https://stackoverflow.com/a/9493060/1293659
    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     *
     * @param   {number}  h       The hue
     * @param   {number}  s       The saturation
     * @param   {number}  l       The lightness
     * @return  {Array}           The RGB representation
     */
    function hslToRgb(h, s, l){
        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    let addFunctions = (scope, $interval) =>
    {
        let getWidget = widgetId => typeof widgetId == "string" ? scope.view.wdg[widgetId] : widgetId

        let animations = {}
        let animate = (widgetId, propertyName, fromValue, deltaValue, delay, count) =>
        {
            let widget = getWidget(widgetId)
            let animationKey = `${widget.widgetName}.${propertyName}`
            if (animations[animationKey]) {
                $interval.cancel(animations[animationKey])
            }

            if (fromValue !== undefined)
            {
                widget[propertyName] = fromValue
            }
            animations[animationKey] = $interval(() => widget[propertyName] += deltaValue, delay, count)
            if (count == 0)
            {
                return animations[animationKey]
            }
            return animations[animationKey]
                .then(() => delete animations[widget])
        }

        scope.animateFromTo = (widgetId, propertyName, fromValue, toValue, duration, delay) =>
        {
            duration = duration !== undefined ? duration : 1000
            delay = delay !== undefined ? delay : 50
            let count = Math.floor(duration / delay)
            let deltaValue = (toValue - fromValue) / count
            return animate(widgetId, propertyName, fromValue, deltaValue, delay, count)
        }

        scope.animateBy = (widgetId, propertyName, deltaValue, delay) =>
        {
            delay = delay !== undefined ? delay : 50
            return animate(widgetId, propertyName, undefined, deltaValue, delay, 0)
        }

        scope.stopAnimation = (widgetId, propertyName) =>
        {
            let widget = getWidget(widgetId)
            let animationKey = `${widget.widgetName}.${propertyName}`
            $interval.cancel(animations[animationKey])
            delete animations[animationKey]
        }

        scope.toggleAnimateFromTo = (widgetId, propertyName, fromValue, toValue, duration, delay) =>
        {
            let widget = getWidget(widgetId)
            let animationKey = `${widget.widgetName}.${propertyName}`
            if (animations[animationKey]) {
                scope.stopAnimation(widget, propertyName)
            }
            else {
                scope.animateFromTo(widget, propertyName, fromValue, toValue, duration, delay)
            }
        }

        scope.toggleAnimateBy = (widgetId, propertyName, deltaValue, delay) =>
        {
            let widget = getWidget(widgetId)
            let animationKey = `${widget.widgetName}.${propertyName}`
            if (animations[animationKey]) {
                scope.stopAnimation(widget, propertyName)
            }
            else {
                scope.animateBy(widget, propertyName, deltaValue, delay)
            }
        }

        scope.animateRotation = (widgetId, axisName, deltaAngle, delay) =>
        {
            return scope.animateBy(widgetId, `r${axisName.toLowerCase()}`, deltaAngle, delay)
        }

        scope.stopRotation = function(widgetId, axisName)
        {
            scope.stopAnimation(widgetId, `r${axisName.toLowerCase()}`)
        }

        scope.toggleRotation = (widgetId, axisName, deltaAngle, delay) =>
        {
            let widget = getWidget(widgetId)
            let animationKey = `${widget.widgetName}.r${axisName.toLowerCase()}`
            if (animations[animationKey]) {
                scope.stopRotation(widget, axisName)
            }
            else {
                scope.animateRotation(widget, axisName, deltaAngle, delay)
            }
        }

        scope.highlight = (widgetId, times, hue, interval) =>
        {
            let widget = getWidget(widgetId)
            times = times !== undefined ? times : 2
            hue = hue !== undefined ? hue : 0
            interval = interval !== undefined ? interval : 50
            let saturation = 0
            let maxSuration = 100
            let deltaSaturation = 10
            return $interval(
                () =>
                {
                    let [r, g, b] = hslToRgb(hue / 360, saturation / maxSuration, 0.5)
                    widget.color = `rgba(${r}, ${g}, ${b}, 1)`
                    saturation += deltaSaturation
                    if (saturation <= 0 || saturation >= maxSuration)
                    {
                        deltaSaturation = -deltaSaturation
                    }
                },
                interval,
                times * 2 * (maxSuration / deltaSaturation) + 1
            )
            .then(() => widget.color = "") // resetting color doesn't work in preview (see https://community.ptc.com/t5/Vuforia-Studio/Model-Item-color-reset/td-p/566003)
        }

        scope.fadeOut = (widgetId, duration, delay) =>
        {
            let widget = getWidget(widgetId)
            return scope.animateFromTo(widget, "opacity", parseFloat(widget.opacity), 0, duration, delay)
        }

        scope.fadeIn = (widgetId, duration, delay) =>
        {
            let widget = getWidget(widgetId)
            return scope.animateFromTo(widget, "opacity", parseFloat(widget.opacity), 1, duration, delay)
        }

        scope.show = widgetId =>
        {
            let widget = getWidget(widgetId)
            widget.visible = true
        }

        scope.hide = widgetId =>
        {
            let widget = getWidget(widgetId)
            widget.visible = false
        }

        scope.toggleVisibility = widgetId =>
        {
            let widget = getWidget(widgetId)
            widget.visible = !widget.visible
        }

        scope.scale = (widgetId, factor, duration, delay) =>
        {
            let widget = getWidget(widgetId)
            return scope.animateFromTo(widget, "scale", parseFloat(widget.scale), factor, duration, delay)
        }

        scope.flash = (widgetId, times, delay) =>
        {
            let widget = getWidget(widgetId)
            delay = delay !== undefined ? delay : 300
            times = times !== undefined ? times : 3
            return $interval(() => widget.visible = !widget.visible, delay, 2 * times)
        }

        scope.getProperty = (widgetId, propertyName) =>
        {
            let widget = getWidget(widgetId)
            return widget[propertyName]
        }

        scope.setProperty = (widgetId, propertyName, value) =>
        {
            let widget = getWidget(widgetId)
            widget[propertyName] = value
        }

        scope.changeProperty = (widgetId, propertyName, deltaValue) =>
        {
            let widget = getWidget(widgetId)
            widget[propertyName] += deltaValue
        }

        scope.rotate = (widgetId, axisName, deltaValue) =>
        {
            scope.changeProperty(widgetId, `r${axisName.toLowerCase()}`, deltaValue)
        }

        let sounds = {}
        scope.playSound = (src, loop) =>
        {
            let sound = new Audio(src)
            sound.loop = loop || false
            sound.play()
            sounds[src] = sound
        }

        scope.stopSound = src =>
        {
            if (sounds[src])
            {
                sounds[src].pause()
                delete sounds[src]
            }
        }

        scope.setImageSource = (widgetId, resourceName) =>
        {
            let widget = getWidget(widgetId)
            widget["src"] = `app/resources/Uploaded/${resourceName}`
        }

        scope.setColor = (widgetId, r, g, b) =>
        {
            let widget = getWidget(widgetId)
            widget.color = `rgba(${r}, ${g}, ${b}, 1)`
        }

        scope.resetColor = widgetId =>
        {
            let widget = getWidget(widgetId)
            widget.color = ""
        }

        scope.getCurrentStep = widgetId =>
        {
            let widget = getWidget(widgetId)
            return widget.currentStep
        }

        scope.setModel = (widgetId, modelName) =>
        {
            let widget = getWidget(widgetId)
            return new Promise((resolve, reject) =>
            {
                let deregisterModelLoadedEvent = scope.$on("modelLoaded", () =>
                {
                    deregisterModelLoadedEvent()
                    deregisterModelLoadFailedEvent()
                    resolve()
                })
                let deregisterModelLoadFailedEvent = scope.$on("modelloadfailed", () =>
                {
                    deregisterModelLoadedEvent()
                    deregisterModelLoadFailedEvent()
                    reject()
                })
                widget.src = `app/resources/Uploaded/${modelName}`
            })
        }

        let getWidgetScope = widgetId =>
        {
            let widgetNode = document.getElementById(widgetId)
            return angular.element(widgetNode).scope()
        }

        scope.playAllSequenceSteps = widgetId =>
        {
            getWidgetScope(widgetId).playAll()
        }

        scope.playNextSequenceStep = widgetId =>
        {
            getWidgetScope(widgetId).play()
        }
    }

    Array.from(document.querySelectorAll("ion-view"))
        .forEach(view =>
        {
            let element = angular.element(view)
            element.injector().invoke(($interval) =>
            {
                addFunctions(element.scope(), $interval)
            })
        })
})();
