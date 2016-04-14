(function(){

	/*
	* 本插件的意义在于可以直接包办动画方法, 即使不支持也可以找这里找到降级方法!
	*
	* 优化经历:
	* 1, transform方法基本兼容且处理多个css属性
	* 2,
	* */

	var cssProp = {
		// 环境条件:
		_transformsEnabled: null,
		_transitionEnabled: null,
		_cssTransitions: null,
		supportTouch: null,

		// 兼容前缀:
		_animType: null,
		_transformType: null,
		_transitionType: null,
		_animationType: null,

		// touchEvent
		_startEvent:null,
		_moveEvent:null,
		_endEvent:null,

		// rAF
		requestAnimationFrame: null,
		cancelAnimationFrame: null,

		// 便捷方法:
		animation: null,
		transition: null,
		transform: null,
		getTranslate: null
	};

	/*事件类型*/
	cssProp.supportTouch = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
	cssProp._startEvent  = cssProp.supportTouch ? 'touchstart' : 'mousedown';
	cssProp._moveEvent   = cssProp.supportTouch ? 'touchmove'  : 'mousemove';
	cssProp._endEvent    = cssProp.supportTouch ? 'touchend'   : 'mouseup'  ;

	/*css兼容*/
	var bodyStyle = document.body.style;

	if (bodyStyle.WebkitTransition !== undefined ||
		bodyStyle.MozTransition !== undefined ||
		bodyStyle.msTransition !== undefined) {
		cssProp._cssTransitions = true;
	}

	// 检测兼容的CSS前缀
	if (bodyStyle.OTransform !== undefined) {
		cssProp._animType = 'OTransform';
		cssProp._transformType = '-o-transform';
		cssProp._transitionType = 'OTransition';
		cssProp._animationType = '-o-animation';
		if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) cssProp._animType = false;
	}
	if (bodyStyle.MozTransform !== undefined) {
		cssProp._animType = 'MozTransform';
		cssProp._transformType = '-moz-transform';
		cssProp._transitionType = 'MozTransition';
		cssProp._animationType = '-moz-animation';
		if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) cssProp._animType = false;
	}
	if (bodyStyle.webkitTransform !== undefined) {
		cssProp._animType = 'webkitTransform';
		cssProp._transformType = '-webkit-transform';
		cssProp._transitionType = 'webkitTransition';
		cssProp._animationType = '-webkit-animation';
		if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) cssProp._animType = false;
	}
	if (bodyStyle.msTransform !== undefined) {
		cssProp._animType = 'msTransform';
		cssProp._transformType = '-ms-transform';
		cssProp._transitionType = 'msTransition';
		cssProp._animationType = '-ms-animation';
		if (bodyStyle.msTransform === undefined) cssProp._animType = false;
	}
	if (bodyStyle.transform !== undefined && cssProp._animType !== false) {
		cssProp._animType = 'transform';
		cssProp._transformType = 'transform';
		cssProp._transitionType = 'transition';
		cssProp._animationType = 'animation';
	}
	cssProp._transformsEnabled = !!cssProp._animType;

	/*
	 * 动画animation
	 * @desc 若无参数表示获取动画状态, 若有参数,那么以元素原本属性为默认值修改animation动画配置
	 * @func animation
	 * @param {obj} settings - 配置
	 * @param {number} settings.name 需要绑定到选择器的 keyframe 名称
	 * @param {string} settings.duration 完成动画所花费的时间，以秒或毫秒计。
	 * @param {string} settings.timing 动画的速度曲线。
	 * @param {number} settings.delay 在动画开始之前的延迟。
	 * @param {number} settings.iteration 动画应该播放的次数。
	 * @param {number} settings.direction 是否应该轮流反向播放动画。本属性须有iteration大于1
	 * @param {function} callback 动画执行完毕的事件。
	 * @example $(elem).animation({  })
	 * */
	cssProp.animation = function(settings, callback) {

		// 思考使用的情景是:
		//1, 新添加name动画
		//2, 动画执行中, 修改配置 (不合理的使用)
		//2, 动画执行中, 切换新动画
		//3, 动画执行后, 新增新动画
		for(var i = 0; i < this.length; i++){
			var elem = this[i];
			if(!arguments.length){return elem.animationState} //没有参数, 访问动画状态
			elem.animationState = 'animating';

			var $elem = $(elem);
			var animationProps = [];
			var elemStyle = elem.style;

			if(settings){
				//animation的属性不能分别添加, 需要一次性按顺序添加添加
				// 属性先获取配置, 后获取元素原有属性, 都没有才使用默认值
				animationProps.push(elem.preAnimationName = settings.name || elemStyle[cssProp._animationType + 'Name'] || elem.preAnimationName);// 存储动画名称, 为了可以再次调用
				animationProps.push(settings.duration || elemStyle[cssProp._animationType + 'Duration'] || '0.01s');
				animationProps.push(settings.timing || elemStyle[cssProp._animationType + 'TimingFunction'] || 'linear');
				animationProps.push(settings.delay || elemStyle[cssProp._animationType + 'Delay'] || '0s');
				animationProps.push(settings.iteration || elemStyle[cssProp._animationType + 'IterationCount'] || '1');
				animationProps.push(settings.direction || elemStyle[cssProp._animationType + 'Direction'] || 'normal');
			}
			//if(settings){ // 无效
			//	if(settings.name !== undefined)animation[cssProp._animationType + '-name'] = settings.name;
			//	if(settings.duration !== undefined)animation[cssProp._animationType + '-duration'] = settings.duration / 1000 + 's';
			//	if(settings.timing !== undefined)animation[cssProp._animationType + '-timing-function'] = settings.timing;
			//	if(settings.delay !== undefined)animation[cssProp.delay + '-delay'] = settings.delay / 1000 + 's';
			//	if(settings.iteration !== undefined)animation[cssProp._animationType + '-iteration-count'] = settings.iteration;
			//	if(settings.direction !== undefined)animation[cssProp._animationType + '-direction'] = settings.direction;
			//}
			cssProp.animationEnd.call($elem, function(){
				$elem.css(
					cssProp._animationType,  // 清理动画名称, 保留动画属性
					' ' + animationProps.slice(1, animationProps.length).join(' ')
				);
				elem.animationState = 'animated';
				if(callback)callback.call(elem);
			});

			$elem.css(cssProp._animationType, animationProps.join(' '));
		}

	};

	/*
	 * 变形过渡transition
	 * @param {obj} settings - 配置
	 * @param {number} settings.duration
	 * @param {string} settings.property
	 * @param {string} settings.timing
	 * @param {number} settings.delay
	 * @example $(elem).transition({ duration: 3000, property: 'all', timing: 'linear', delay: 1000 })
	 * */
	cssProp.transition = function(settings, callback) {
		var transition = {}, $this = $(this);
		if(settings){
			if(settings.duration)transition[cssProp._transitionType + '-duration'] = settings.duration / 1000 + 's';
			if(settings.property)transition[cssProp._transitionType + '-property'] = settings.property;
			if(settings.timing)transition[cssProp._transitionType + '-timing-function'] = settings.timing;
			if(settings.delay)transition[cssProp._transitionType + '-delay'] = settings.delay / 1000 + 's';
		}
		//if($.typeof(settings) === 'function'){callback = settings}
		//if(callback){
		//	$this.transitionEnd(callback)
		//}
		$this.css(transition);
	};

	/*
	* 变形transform
	* transform的使用不同于与animate/transition, 因为它的旧有值会被新值覆盖!
	* 由于transform有多个属性, options的值这里是固定格式! {pos:[12, 24, 36], scale: [1, 1, 0], rotate: [0, 0, 0], skew: [0, 0], perspective:0}
	* */
	cssProp.transform = function(options) {
		var optionsDemo = {pos:[12, 24, 36], scale: [1, 1, 0], rotate: {x: 0, y: 0, z: 0, deg:0}, skew: [0, 0], perspective:0};

		var transformProp = {};
		options = options || {};
		var pos, scale, rotate = '', skew, prt;

		/*环境没有transform功能*/
		if (cssProp._transformsEnabled === false) {
			if(options.pos){
				transformProp.left = options.pos[0];
				transformProp.top  = options.pos[1];
			}
		} else {
			/*环境无transition功能*/
			if (cssProp._cssTransitions === false) {
				pos    = options.pos    ? 'translate(' + options.pos[0] + 'px, ' + options.pos[1] + 'px) ' : '';
				scale  = options.scale  ? 'scale(' + options.scale[0] + ', ' + options.scale[1] + ') ' : '';
			}
			/*环境支持最优功能*/
			else {
				pos    = options.pos    ? 'translate3d(' + options.pos[0] + 'px, ' + options.pos[1] + 'px, ' + (options.pos[2]||0) + 'px) ' : '';
				scale  = options.scale  ? 'scale3d(' + options.scale[0] + ', ' + options.scale[1] + ', ' + (options.scale[2]||0) + ') ' : '';
			}
			/*rotate*/
			if(options.rotate){
				if(options.rotate.deg){
					if(cssProp._cssTransitions && options.rotate.z){
						rotate = 'rotate3d(' + options.rotate.x + ',' + options.rotate.y + ',' + options.rotate.z + ',' + options.rotate.deg +'deg) ';
					}else{
						rotate = 'rotate(' + options.rotate.deg + 'deg) ';
					}
				}else{
					rotate =
						(options.rotate.x ? 'rotateX(' + options.rotate.x + 'deg) ' : '' ) +
						(options.rotate.y ? 'rotateY(' + options.rotate.y + 'deg) ' : '' ) +
						(options.rotate.z ? 'rotateZ(' + options.rotate.z + 'deg) ' : '' );
				}
			}
			/*skew*/
			skew = options.skew ? 'skew(' + options.skew[0] + ', ' + options.skew[1] + ') ' : '';
			/*perspective*/
			prt  = options.perspective   ? 'perspective(' + options.perspective + 'px) ' : '';
			/*属性合并*/
			transformProp[cssProp._transformType] = pos + scale + rotate + skew + prt;
		} console.log('transformProp', transformProp);
		$(this).css(transformProp);
	};

	/* 获取transform的属性值是很难的, matrix计算比较复杂*/
	cssProp.getComputedTranslateZ = function(id) {
		if(!window.getComputedStyle) return;
		var obj = document.getElementById(id);
		var style = getComputedStyle(obj),
			transform = style.transform || style.webkitTransform || style.mozTransform;
		var mat = transform.match(/^matrix3d\((.+)\)$/);
		return mat ? ~~(mat[1].split(', ')[14]) : 0;
	};

	cssProp.animationEnd = function (callback) {
		var events = ['webkitAnimationEnd', 'OAnimationEnd', 'MSAnimationEnd', 'animationend'],
			i, j, dom = this;
		function fireCallBack(e) {
			callback(e);
			for (i = 0; i < events.length; i++) {
				dom.off(events[i], fireCallBack);
			}
		}
		if (callback) {
			for (i = 0; i < events.length; i++) {
				dom.on(events[i], fireCallBack);
			}
		}
		return this;
	};

	cssProp.transitionEnd = function (callback) {
		var events = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'MSTransitionEnd', 'msTransitionEnd'],
			i, j, dom = this;
		function fireCallBack(e) {
			/*jshint validthis:true */
			if (e.target !== this) return;
			callback.call(this, e);
			for (i = 0; i < events.length; i++) {
				dom.off(events[i], fireCallBack);
			}
		}
		if (callback) {
			for (i = 0; i < events.length; i++) {
				dom.on(events[i], fireCallBack);
			}
		}
		return this;
	};

	cssProp.getTranslate = function (el, axis) {
		var matrix, curTransform, curStyle, transformMatrix;

		// automatic axis detection
		if (typeof axis === 'undefined') {
			axis = 'x';
		}

		curStyle = window.getComputedStyle(el, null);
		if (window.WebKitCSSMatrix) {
			// Some old versions of Webkit choke when 'none' is passed; pass
			// empty string instead in this case
			transformMatrix = new WebKitCSSMatrix(curStyle.webkitTransform === 'none' ? '' : curStyle.webkitTransform);
		}
		else {
			transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform  || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
			matrix = transformMatrix.toString().split(',');
		}

		if (axis === 'x') {
			//Latest Chrome and webkits Fix
			if (window.WebKitCSSMatrix)
				curTransform = transformMatrix.m41;
			//Crazy IE10 Matrix
			else if (matrix.length === 16)
				curTransform = parseFloat(matrix[12]);
			//Normal Browsers
			else
				curTransform = parseFloat(matrix[4]);
		}
		if (axis === 'y') {
			//Latest Chrome and webkits Fix
			if (window.WebKitCSSMatrix)
				curTransform = transformMatrix.m42;
			//Crazy IE10 Matrix
			else if (matrix.length === 16)
				curTransform = parseFloat(matrix[13]);
			//Normal Browsers
			else
				curTransform = parseFloat(matrix[5]);
		}

		return curTransform || 0;
	};

	cssProp.requestAnimationFrame = function (callback) {
		if (window.requestAnimationFrame) return window.requestAnimationFrame(callback);
		else if (window.webkitRequestAnimationFrame) return window.webkitRequestAnimationFrame(callback);
		else if (window.mozRequestAnimationFrame) return window.mozRequestAnimationFrame(callback);
		else {
			return window.setTimeout(callback, 1000 / 60);
		}
	};
	cssProp.cancelAnimationFrame = function (id) {
		if (window.cancelAnimationFrame) return window.cancelAnimationFrame(id);
		else if (window.webkitCancelAnimationFrame) return window.webkitCancelAnimationFrame(id);
		else if (window.mozCancelAnimationFrame) return window.mozCancelAnimationFrame(id);
		else {
			return window.clearTimeout(id);
		}
	};

	$.extend(jQuery.fn, cssProp);
}());



















/*
 *
 * @example
 var translateA = 'translate3D(' + position.left +'px, ' + position.top +'px, 0px)';
 this._addKeyframes('pos' + i, {
 '0%,100%': {
 opacity: 1,
 'z-index': 99,
 '-webkit-transform': translateA + ' scale3d(1, 1, 1)',
 transform: translateA + ' scale3d(1, 1, 1)'
 },
 '50%': {
 opacity: 0.5,
 'z-index': 99,
 '-webkit-transform': translateA + ' scale3d(1.2, 1.2, 1.2)',
 transform: translateA + ' scale3d(1.2, 1.2, 1.2)'
 }
 });
 * */

//cssProp.addKeyframes = function(name, frames){
//	// 参数name, frames是必须的
//
//	// 生成style标签
//	var styleTag = document.createElement('style');
//	styleTag.rel = 'stylesheet';
//	styleTag.type = 'text/css';
//	// 插入到head里
//	document.getElementsByTagName('head')[0].appendChild(styleTag);
//
//	var styles = styleTag.sheet;
//
//	// 生成name命名的keyframes
//	try {
//		var idx = styles.insertRule('@keyframes ' + name + '{}',
//			styles.cssRules.length);
//	}
//	catch(e) {
//		if(e.name == 'SYNTAX_ERR' || e.name == 'SyntaxError') {
//			idx = styles.insertRule('@-webkit-keyframes ' + name + '{}',
//				styles.cssRules.length);
//		}
//		else {
//			throw e;
//		}
//	}
//
//	var original = styles.cssRules[idx];
//
//	// 遍历参数2frames对象里的属性, 来添加到keyframes里
//	for(var text in frames) {
//		var  css = frames[text];
//
//		var cssRule = text + " {";
//
//		for(var k in css) {
//			cssRule += k + ':' + css[k] + ';';
//		}
//		cssRule += "}";
//		if('appendRule' in original) {
//			original.appendRule(cssRule);
//		}
//		else {
//			original.insertRule(cssRule);
//		}
//	}
//};