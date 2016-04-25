(function(){

	/*
	* 本插件的意义在于可以直接包办动画方法, 即使不支持也可以找这里找到降级方法!
	*
	* 优化经历:
	* 1, transform方法基本兼容且处理多个css属性
	* 2, 区分动态方法与静态方法
	* 3, 修改命名
	* //todo 优化transform有记忆功能
	* */

	var gadget = { 
		/*静态方法及属性*/
		css: null,

		environment: null,

		// eventType
		startEventType: null,
		processEventType: null,
		stopEventType: null,

		// requestAnimationFrame
		rAF: null,
		off_rAF: null,
		
		// 触控点坐标
		getTouchPos: null,
		getTouchX: null,
		getTouchY: null
	};
	
	gadget.environment = {
		// css兼容前缀
		isTransformsEnabled: null,
		isTransitionEnabled: null,
		isTouchEnable: null
	};
	
	gadget.css = {
		type: null,
		transformType: null,
		transitionType: null,
		animationType: null
	};

	gadget.fnMethods = {
		/*动态方法*/
		animation: null,
		transition: null,
		transform: null,
		getTranslate: null,

		// 绑定事件类型与方法的Api
		onUiStart: null,
		onUiProcess: null,
		onUiStop: null
	};

	/*事件类型*/
	gadget.environment.isTouchEnable = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
	gadget.startEventType = gadget.environment.isTouchEnable ? 'touchstart' : 'mousedown';
	gadget.processEventType = gadget.moveEventType = gadget.environment.isTouchEnable ? 'touchmove'  : 'mousemove';
	gadget.stopEventType = gadget.environment.isTouchEnable ? 'touchend'   : 'mouseup'  ;

	/*事件绑定*/
	$.each(['on', 'one', 'off'], function(i, pre){
		$.each(['Start', 'Process', 'Stop'], function(k, type){
			var methodName = pre + 'Ui' + type;
			var eventType = type.toLowerCase() + 'EventType';
			gadget.fnMethods[methodName] = function(){
				var args = Array.prototype.slice.call( arguments );
				args.unshift(gadget[eventType]);
				return $.fn[pre].apply(this, args);
			}
		});
	});

	/*获取触控点的坐标值*/
	gadget.getTouchPage = function (coord, event) {
		return (gadget.environment.isTouchEnable? event.originalEvent.touches[0]: event)['page' + coord.toUpperCase()];
	};
	gadget.getTouchX = function (event) {
		return gadget.getTouchPage.call(this, 'x', event);
	};
	gadget.getTouchY = function (event) {
		return gadget.getTouchPage.call(this, 'y', event);
	};
	gadget.getTouchPos = function (event) {
		var x = gadget.getTouchX(event);
		var y = gadget.getTouchY(event);
		return [x, y];
	};

	/*css兼容*/
	var bodyStyle = document.body.style;

	if (bodyStyle.WebkitTransition !== undefined ||
		bodyStyle.MozTransition !== undefined ||
		bodyStyle.msTransition !== undefined) {
		gadget.environment.isTransitionEnabled = true;
	}

	// 检测兼容的CSS前缀
	if (bodyStyle.OTransform !== undefined) {
		gadget.css.type = 'OTransform';
		gadget.css.transformType = '-o-transform';
		gadget.css.transitionType = 'OTransition';
		gadget.css.transitionEndType = 'OTransitionEnd';
		gadget.css.animationType = '-o-animation';
		gadget.css.animationEndType = 'OAnimationEnd';
		if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) gadget.css.type = false;
	}
	if (bodyStyle.MozTransform !== undefined) {
		gadget.css.type = 'MozTransform';
		gadget.css.transformType = '-moz-transform';
		gadget.css.transitionType = 'MozTransition';
		gadget.css.transitionEndType = 'MozTransitionEnd';
		gadget.css.animationType = '-moz-animation';
		gadget.css.animationEndType = 'MozAnimationEnd'; // 不存在
		if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) gadget.css.type = false;
	}
	if (bodyStyle.webkitTransform !== undefined) {
		gadget.css.type = 'webkitTransform';
		gadget.css.transformType = '-webkit-transform';
		gadget.css.transitionType = 'webkitTransition';
		gadget.css.transitionEndType = 'webkitTransitionEnd';
		gadget.css.animationType = '-webkit-animation';
		gadget.css.animationEndType = 'webkitAnimationEnd';
		if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) gadget.css.type = false;
	}
	if (bodyStyle.msTransform !== undefined) {
		gadget.css.type = 'msTransform';
		gadget.css.transformType = '-ms-transform';
		gadget.css.transitionType = 'msTransition';
		gadget.css.transitionEndType = 'msTransitionEnd';
		gadget.css.animationType = '-ms-animation';
		gadget.css.animationEndType = 'MSAnimationEnd';
		if (bodyStyle.msTransform === undefined) gadget.css.type = false;
	}
	if (bodyStyle.transform !== undefined && gadget.css.type !== false) {
		gadget.css.type = 'transform';
		gadget.css.transformType = 'transform';
		gadget.css.transitionType = 'transition';
		gadget.css.transitionEndType = 'transitionend';
		gadget.css.animationType = 'animation';
		gadget.css.animationEndType = 'animationend';
	}
	gadget.environment.isTransformsEnabled = !!gadget.css.type;

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
	gadget.fnMethods.animation = function(settings, callback) {

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
				animationProps.push(elem.preAnimationName = settings.name || elemStyle[gadget.css.animationType + 'Name'] || elem.preAnimationName);// 存储动画名称, 为了可以再次调用
				animationProps.push(settings.duration || elemStyle[gadget.css.animationType + 'Duration'] || '0.01s');
				animationProps.push(settings.timing || elemStyle[gadget.css.animationType + 'TimingFunction'] || 'linear');
				animationProps.push(settings.delay || elemStyle[gadget.css.animationType + 'Delay'] || '0s');
				animationProps.push(settings.iteration || elemStyle[gadget.css.animationType + 'IterationCount'] || '1');
				animationProps.push(settings.direction || elemStyle[gadget.css.animationType + 'Direction'] || 'normal');
			}
			//if(settings){ // 无效
			//	if(settings.name !== undefined)animation[gadget.css.animationType + '-name'] = settings.name;
			//	if(settings.duration !== undefined)animation[gadget.css.animationType + '-duration'] = settings.duration / 1000 + 's';
			//	if(settings.timing !== undefined)animation[gadget.css.animationType + '-timing-function'] = settings.timing;
			//	if(settings.delay !== undefined)animation[gadget.delay + '-delay'] = settings.delay / 1000 + 's';
			//	if(settings.iteration !== undefined)animation[gadget.css.animationType + '-iteration-count'] = settings.iteration;
			//	if(settings.direction !== undefined)animation[gadget.css.animationType + '-direction'] = settings.direction;
			//}
			gadget.animationEnd.call($elem, function(){
				$elem.css(
					gadget.css.animationType,  // 清理动画名称, 保留动画属性
					' ' + animationProps.slice(1, animationProps.length).join(' ')
				);
				elem.animationState = 'animated';
				if(callback)callback.call(elem);
			});

			$elem.css(gadget.css.animationType, animationProps.join(' '));
		}

		return this;
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
	gadget.fnMethods.transition = function(settings, callback) {
		var transition = {}, $this = $(this);
		if(settings){
			if(settings.duration || settings.duration === 0)transition[gadget.css.transitionType + '-duration'] = settings.duration / 1000 + 's';
			if(settings.property)transition[gadget.css.transitionType + '-property'] = settings.property;
			if(settings.timing || settings.timing === 0)transition[gadget.css.transitionType + '-timing-function'] = settings.timing;
			if(settings.delay || settings.delay === 0)transition[gadget.css.transitionType + '-delay'] = settings.delay / 1000 + 's';
		}
		$this.css(transition);
		return this;
	};
	gadget.fnMethods.noTransition = function(){ return $(this).transition({duration:0}); };

	/*
	* 变形transform
	* transform的使用不同于与animate/transition, 因为它的旧有值会被新值覆盖!
	* 由于transform有多个属性, options的值这里是固定格式! {pos:[12, 24, 36], scale: [1, 1, 0], rotate: [0, 0, 0], skew: [0, 0], perspective:0}
	* */
	gadget.fnMethods.transform = function(options) {
		var optionsDemo = {pos:[12, 24, 36], scale: [1, 1, 0], rotate: {x: 0, y: 0, z: 0, deg:0}, skew: [0, 0], perspective:0};

		var transformProp = {};
		options = options || {};
		var pos, scale, rotate = '', skew, prt;

		/*环境没有transform功能*/
		if (gadget.environment.isTransformsEnabled === false) {
			if(options.pos){
				transformProp.left = options.pos[0];
				transformProp.top  = options.pos[1];
			}
		} else {
			/*环境无transition功能*/
			if (gadget.environment.isTransitionEnabled === false) {
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
					if(gadget.environment.isTransitionEnabled && options.rotate.z){
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
			transformProp[gadget.css.transformType] = pos + scale + rotate + skew + prt;
		} //console.log('transformProp', transformProp);
		return $(this).css(transformProp);
	};

	/* 获取transform的属性值是很难的, matrix计算比较复杂*/
	gadget.getComputedTranslateZ = function(id) {
		if(!window.getComputedStyle) return;
		var obj = document.getElementById(id);
		var style = getComputedStyle(obj),
			transform = style.transform || style.webkitTransform || style.mozTransform;
		var mat = transform.match(/^matrix3d\((.+)\)$/);
		return mat ? ~~(mat[1].split(', ')[14]) : 0;
	};

	gadget.animationEnd = function (callback) {
		return this.one(gadget.css.animationEndType, callback);
	};

	gadget.fnMethods.transitionEnd = function (callback) {
		return this.one(gadget.css.transitionEndType, callback);
	};

	gadget.fnMethods.getTranslate = function (el, axis) {
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

	gadget.rAF = function (callback) {
		if (window.requestAnimationFrame) return window.requestAnimationFrame(callback);
		else if (window.webkitRequestAnimationFrame) return window.webkitRequestAnimationFrame(callback);
		else if (window.mozRequestAnimationFrame) return window.mozRequestAnimationFrame(callback);
		else {
			return window.setTimeout(callback, 1000 / 60);
		}
	};
	gadget.off_rAF = function (id) {
		if (window.cancelAnimationFrame) return window.cancelAnimationFrame(id);
		else if (window.webkitCancelAnimationFrame) return window.webkitCancelAnimationFrame(id);
		else if (window.mozCancelAnimationFrame) return window.mozCancelAnimationFrame(id);
		else {
			return window.clearTimeout(id);
		}
	};

	gadget.addKeyframes = function(name, frames){
		gadget._RenderKeyframesDemo =  function(){
			// 示范使用addKeyframes方法生成与_gridPosAry对应位置的keyframes
			var gridPosAry = this._gridPosAry;
			for(var i = 0; i < gridPosAry.length; i++){
				var position = gridPosAry[i];
				var translateA = 'translate3D(' + position.left +'px, ' + position.top +'px, 0px)';
				gadget.addKeyframes('pos' + i, {
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
			}
		};
		// 参数name, frames是必须的

		// 生成style标签
		var styleTag = document.createElement('style');
		styleTag.rel = 'stylesheet';
		styleTag.type = 'text/css';
		// 插入到head里
		document.getElementsByTagName('head')[0].appendChild(styleTag);

		var styles = styleTag.sheet;

		// 生成name命名的keyframes
		try {
			var idx = styles.insertRule('@keyframes ' + name + '{}',
				styles.cssRules.length);
		}
		catch(e) {
			if(e.name == 'SYNTAX_ERR' || e.name == 'SyntaxError') {
				idx = styles.insertRule('@-webkit-keyframes ' + name + '{}',
					styles.cssRules.length);
			}
			else {
				throw e;
			}
		}

		var original = styles.cssRules[idx];

		// 遍历参数2frames对象里的属性, 来添加到keyframes里
		for(var text in frames) {
			var  css = frames[text];

			var cssRule = text + " {";

			for(var k in css) {
				cssRule += k + ':' + css[k] + ';';
			}
			cssRule += "}";
			if('appendRule' in original) {
				original.appendRule(cssRule);
			}
			else {
				original.insertRule(cssRule);
			}
		}
	};

	$.extend(jQuery.fn, gadget.fnMethods);
	jQuery.fn.gadget = gadget;
}());