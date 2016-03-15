(function(){

	var cssProp = {
		// 环境条件:
		_transformEnabled: null,
		_transitionEnabled: null,

		// 兼容前缀:
		_animType: null,
		_transformType: null,
		_transitionType: null,
		_animationType: null,

		// 便捷方法:
		animation: null,
		transition: null,
		transform: null
	};

	var bodyStyle = document.body.style;

	if (bodyStyle.WebkitTransition !== undefined ||
		bodyStyle.MozTransition !== undefined ||
		bodyStyle.msTransition !== undefined) {
		cssProp._transitionEnabled = true;
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
	cssProp._transformEnabled = !!cssProp._animType;

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
	* */
	cssProp.transform = function(settings) {
		var transform = {};
		transform[cssProp._transformType] = settings;
		$(this).css(transform);
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