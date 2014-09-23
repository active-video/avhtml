/**
 * @author Chad Wagner, c.wagner@avnetworks.com
 * @fileoverview DOM MANIPULATION - hardcoded inline because required by av.js; provides utility methods to query, update, and manipulate the HTML DOM.
 * @version 1.0
 */
(function(av){
  /**
   * 
   * @namespace
   * <pre>DOM Manipulation methods and helpers for the ActiveVideo platform; provides utility methods to query, 
   * update,and manipulate the HTML DOM. 
   * 
   * First call av.require('dom') to begin using.</pre>
   * @example av.require('dom');//loads dom namespace
   */
	av.dom = {
	 /**
	  * The current version of the av.dom library.
	  * @property
	  */	version : '1.0.1',
	  
	  /**
		 * An instance of av.Log used and namespaced for av.dom
		 * @type {av.Log}
		 * @property
		 * @memberOf av.dom#
		 */
	    log : new av.Log(av.getEffectiveLogLevel('dom'),'av.dom'),
	  
	  /**
	   * Used to keep track of how many dynamic div's have been created, so that id's can be generated for subsequent elements (namely lightboxes).
	   * @property
	   * @private
	   */
		index : 0,
		/**
		 * Get an element by id from the current document, alias for document.getElementById(id), except can be executed from a persistent object against the current document.
		 * @param {String,HTMLElement} elemOrId An HTMLElement or the id of an HTML element
		 */
		get 	: function(elemOrId){
			return typeof(elemOrId) == 'string' ? av.doc.getElementById(elemOrId) : elemOrId
		},
		/**
		 * Focus an element on the page.
		 * @param {String,HTMLElement} elemOrId An HTMLElement or the id of an HTML element
		 * @param {Boolean} [scrollIntoView=false] Minimize scrolling of page when focusing - scroll only as 
		 * 					much as is needed to get the element into the current view
		 */
		focus : function(elemOrId, scrollIntoView){
			var el = av.dom.get(elemOrId);
			//av.dom.log.debug(el)
			if(el !== null && typeof(el.focus) == 'function'){
				if(scrollIntoView){
					av.dom.scrollIntoView(elemOrId);
				}
				el.focus();
			}
			else av.dom.log.debug("Cannot focus " + elemOrId + " element not found")
		},
		/**
		 * 
		 */
		getNav : function(elemOrId, dir){
			var elem = av.dom.get(elemOrId), nextElem, cssDir, start;
			if(elem == undefined){
				av.dom.log.warn("av.dom.getStyles("+elemOrId+",...) - cannot getNav from style of non-existent DOM node.");
				return {};
			}
			//assume dir is not correct case, and make css compatible
			var dir = 'nav' + dir.substring(0,1).toUpperCase() + dir.substring(1).toLowerCase();
		 	var cssDir = 'nav-'+dir.toLowerCase();
		 	
		 	var style = elem.getAttribute('style').toString();//browser will not parse navUp into the style object
			start = style ? style.indexOf(cssDir) : -1;
			
			if(elem.getAttribute(dir)){
				return elem.getAttribute(dir);
			}else if(start == -1){
				nextElem = elem.style[dir];
				if(nextElem){
					return nextElem.replace('#','');
				}
			}else{
	 			nextElem = style.substring(start+cssDir.length+1);
	 			if(nextElem.indexOf(';') != -1) nextElem = nextElem.substring(0, nextElem.indexOf(';'));
	 			nextElem = nextElem.replace(/^\s+|\s+$/g, '');//trim
	 			
	 			elem.setAttribute(dir, nextElem);//cache this calculation for the next time
	 			return nextElem;
	 		}
	 		return '';
		},
		
		getTotalHeight : function(elemOrId){
			var elem = av.dom.get(elemOrId);
			if(!elem){return 0;}

			return (elem.offsetHeight ? elem.offsetHeight : 0) + (elem.offsetTop ? elem.offsetTop : 0) - (elem.nextSibling ? av.dom.getTotalHeight(elem.nextSibling) : 0) 
		},
		
		/**
		 * Get height between an element's start and the start of the next sibling node. Do not use for absolutely positioned nodes or non-block-level nodes. 
		 */
		getAvailableHeight : function(elemOrId){
			var elem = av.dom.get(elemOrId), next = elem.nextSibling;
			var height = 0, nextTop = av.dom.getNextNodeTop(elem);
			
			//console.log(nextTop, elem.offsetTop, elem.parentNode.offsetHeight, elem.offsetTop)
			if(next && nextTop){
				height = nextTop - elem.offsetTop;
			}else{
				height = elem.parentNode.offsetHeight - elem.offsetTop;
			}
			
			return height;
		},
		
		getNextNodeTop : function(elemOrId){
			var elem = av.dom.get(elemOrId), next = elem.nextSibling;
			if(next && next.offsetTop){
				return next.offsetTop;
			}else if(next){
				return av.dom.getNextNodeTop(next);
			}else{
				return 0;
			}
		},
		
		ellipsis : function(elemOrId, str, ellipsis){
			var ellipsis = typeof(ellipsis) == 'string' ? ellipsis : '...';
			var elem = av.dom.get(elemOrId);
			var height = av.dom.getAvailableHeight(elem);
			
			//if the DOM is not ready, the height will be 0, so we can give it some time and retry
			 
			if(!height){
				setTimeout(function(){av.dom.ellipsis(elem, str)},10);
				return str;
			}
			
			elem.innerHTML = str;
			
			//console.log('ellipsis: height is ' + height  + ' and cur height: ' + elem.offsetHeight);
			
			
			var fits = function(){
				var curHeight = elem.scrollHeight;//was offsetHeight, but didn't account for overflow
				return curHeight <= height;
			}
			
			var shortenUntilItFits = function(s){
				//var curWidth = parseFloat(window.getComputedStyle(elem).width);
				var newStr = s + ellipsis;
				elem.innerHTML = newStr;
				//need to truncate?
				if(!fits() && s.length > 0){
					s = s.substr(0, s.length-1);
					return shortenUntilItFits(s);
				}else{
					return newStr;
				}
			}
			if(fits()){
				return str;
			}else{
				return shortenUntilItFits(str);	
			}
			
		},
		
		/**
		 * 
		 */
		getTags : function(){
			var toReturn = []; 
			if(arguments.length == 0 ) return toReturn;
			
			if(typeof(arguments[0]) != 'string') return av.dom.getTags.apply(av.dom,arguments[0]);//accepts an array argument 
			
			//accepts , seperated arguments as well
			for(var t=0; t<arguments.length; t++){
				var items = av.doc.getElementsByTagName(arguments[t]);
				for(var i=0; i<items.length; i++) toReturn.push(items.item(i));
			}
			
			return toReturn;
		},
		
		
		/**
		 * Count the number of tag occurances in the DOM - takes a variable number of arguments. DOM must be loaded
		 */
		getTagCount : function(){
			var tags = (arguments.length == 0 ) ? ['audio', 'button', 'div', 'iframe', 'img', 'object', 'p', 'textarea', 'video' ] : arguments;
			var tagCounts = {};
			var numElementsInDom = 0;
			var bgimages = 0;
			for(var i=0; i<tags.length; i++){
				var elems = av.dom.getTags(tags[i]);
				tagCounts[tags[i]] = elems.length;
				for(var el=0; el < elems.length; el++){
					numElementsInDom++;
					var bgimage = window.getComputedStyle(elems[el],'');
						bgimage = bgimage && typeof(bgimage.backgroundImage) == 'string' ? bgimage.backgroundImage : '' ;//stitcher
						if(bgimage == '' && elems[el].style.backgroundImage != '') bgimage = elems[el].style.backgroundImage;//hilversum
						//print(uneval(bgimage));
					//tagCounts['bgimage-'+i+'-'+el] = bgimage;
					if(typeof(bgimage) == 'string' && bgimage != '' && bgimage != 'none') bgimages++;
				}
			}
			tagCounts.totalBackgroundImages = bgimages;
			tagCounts.totalElements = numElementsInDom;
			
			return tagCounts;
		},
	
		generateReport : function(){
			var allNodesCount = av.dom.getTagCount();
			var report = '';
			var addMessage = function(msg, result){report += ("\n\t---- " + msg + " ----\n\t\t" + result);}
			report += "\n----------START DOM REPORT----------";
			addMessage("Number of dom nodes", uneval(allNodesCount));
			addMessage("Number of elements with background images", allNodesCount.totalBackgroundImages);
			report += "\n----------END DOM REPORT----------\n";
			
			av.dom.log.debug(report);

		},
	
		
		/**
		 * Set the content of an HTMLElement to the provided 2nd argument
		 * @param {String,HTMLElement} elemOrId An HTMLElement or the id of an HTML element
		 * @param {String,HTMLElement,NodeList} content The content to replace the contents of an existing element with, will override existing children of elemOrId.
		 */
		set : function(elemOrId, content){
			var elem = av.dom.get(elemOrId);
			if(elem != null && typeof(elem) != 'undefined'){
				av.dom.replaceChildren(elem, content);
				return true;
			}else{
				return false;
			}
		},
		/**
		 * 
		 */
		setStyle: function(elemOrId, styles){
			//av.dom.log.debug(elemOrId);
			var elem = av.dom.get(elemOrId);
			for(var styleName in styles) elem.style[styleName] = styles[styleName]; 
		},
		
		getStyles : function(elemOrId, propOrProps){
			var elem = av.dom.get(elemOrId);
			if(elem == undefined){
				av.dom.log.warn("av.dom.getStyles("+elemOrId+",...) - cannot determine styles of non-existent DOM node.");
				return {};
			}
			var styles = window.getComputedStyle(elem, '');
			styles = av.mergeObjects(elem.style, styles);//hilversum getComputedStyle behaves unexpectedly, use .style
			
			//return styles;
			//just 1 style?
			if(typeof(propOrProps) == 'string') return typeof(styles[propOrProps]) != 'undefined' ? styles[propOrProps] : '';
			if(typeof(propOrProps) == 'undefined') return styles;
				
			//multiple styles
			var requestedStyles = {};
			for(var i=0; i<propOrProps.length; i++){
				requestedStyles[propOrProps[i]] = styles[propOrProps[i]];//typeof(styles[propOrProps[i]]) != 'undefined' ? styles[propOrProps[i]] : ''; 
			}
			return styles;
		},
		
		hasClass : function(elemOrId,className){
			var elem = av.dom.get(elemOrId);
			return elem ? elem.className.match(new RegExp('(\\s|^)'+className+'(\\s|$)')) : false;
		},
		
		addClass : function(elemOrId, className){
			var elem = av.dom.get(elemOrId);
			if (elem && !av.dom.hasClass(elem,className)) elem.className += " "+className;
		},
		
		removeClass : function(elemOrId, className){
			var elem = av.dom.get(elemOrId);
			if (elem && av.dom.hasClass(elem,className)) {
				var reg = new RegExp('(\\s|^)'+className+'(\\s|$)');
				elem.className=elem.className.replace(reg,' ');
			}
		},
		
		replaceClass : function(elemOrId, fromClassName, toClassName){
			var elem = av.dom.get(elemOrId);
			if (elem && av.dom.hasClass(elem,fromClassName)) {
				var reg = new RegExp('(\\s|^)'+fromClassName+'(\\s|$)');
				elem.className = elem.className.replace(reg,' ' + toClassName + ' ');
			}else if(elem){
				av.dom.addClass(elem, toClassName);	
			}
		},
		
		/**
		 * 
		 */
		removeChildren : function(elemOrId){
			av.dom.log.debug(elemOrId);
			var elem = av.dom.get(elemOrId);
			if(!elem){return false;}//non existent node
			av.dom.log.debug('e.hasChildNodes)()='+elem.id);//+ != 'undefined' && e.hasChildNodes())   );			
			while(elem && elem.hasChildNodes()){	
				elem.removeChild(elem.lastChild);
			}
		},
		/**
		 * Replace the children of an HTMLElement with the newChildren (overloaded).
		 * @param {String,HTMLElement} elemOrId An HTMLElement or the id of an HTML element
		 * @param {HTMLElement,String,NodeList} newChildren The elements to place in the HTMLElement as the new children.
		 * @return {Boolean} True if element existed, false otherwise.
		 */
		replaceChildren : function(elemOrId, newChildren){
			var e = av.dom.get(elemOrId);
			if(!e) return false;
			av.dom.removeChildren(e);
			if(typeof(newChildren) == 'undefined' || !newChildren){return true;}//nothing to add
			//Insert a NODELIST or [elements] from an array
			if(typeof(newChildren) == 'string'){
				/*av.dom.log.debug("set() - " + e.id + ': ' + newChildren);*/
				e.innerHTML = newChildren;
			}else if(newChildren.hasOwnProperty('length')){
				for(var i=0; i<newChildren.length; i++){
					e.appendChild(newChildren.hasOwnProperty('item') ? newChildren.item(i) : newChildren[i]);
				}
			}else{//Insert a singleton NODE
				e.appendChild(newChildren);
			}
			return true;
		},
		
		/**
		 * Given an event, create an object that can be used as a replica without affecting properties of the existing event.
		 * @param {Event} evt
		 */
		cloneEvent : function(evt){
			
			var e = {
				target : evt.target,
				type : evt.type,
				currentTarget : evt.currentTarget,
				eventPhase : evt.eventPhase,
				cancelable : evt.cancelable,
				
			};
			if(typeof(evt.preventDefault) == 'function') e.preventDefault = evt.preventDefault;
			if(typeof(evt.stopPropagation) == 'function') e.stopPropagation = evt.stopPropagation;
			if(typeof(evt.keyIdentifier) != 'undefined') e.keyIdentifier = evt.keyIdentifier;
			if(typeof(evt.keyCode) != 'undefined') e.keyCode = evt.keyCode;
			
			return e;
		},
		
		/**
		 * @param {String,HTMLElement} elemOrId An HTMLElement or the id of an HTML element
		 * @param {String} eventType The event to observe.
		 * @param {Function} funcHandle The function to trigger when the event occurs, the function will be invoked in the global scope with the 1st argument being the Event itav.dom.
		 * @param {Boolean} bubble Should the event bubble?
		 */
		addEventListener : function(elemOrId, eventType, funcHandle, bubbles){
			var elem = av.dom.get(elemOrId);
			var bub = typeof(bubbles) == 'boolean' ? bubbles : true;
			if(typeof(eventType) != 'string') throw "addEventListener(...) - 2nd argument must be a string (click, keydown, etc), received " + eventType;
			
			return elem ? elem.addEventListener(eventType, funcHandle, bub) : false;
		},
		
		
		/**
		 * Expects evts to be an arrray of event listener arguments of length 4 (@see av.dom.addEventListener)
		 * @param {Array[Arguments]} evts {@link #.addEventListener} An array of arguments to call av.dom.addEventListener with in succession 
		 */
		addEventListeners : function(evts){
			for(var i=0; i<evts.length; i++){
				var evt = evts.hasOwnProperty('item') ? evts.item(i) : evts[i];
				av.dom.addEventListener.apply(av.dom, evt);
			}
		},
		
		/**
		 * Convert a number to a multiple of 16 using standard Math.round(), ensures a number falls on the 16x16 macroblock grid.
		 * @param {Number} num A number between 0 and the size of the page.
		 */
		putOnGrid : function(num){
			return Math.round(num/16)*16
		},
		/**
		 * Given the height of the current page, we convert the 'height' argument into an absolute (px-based) number and return that number
		 * @param {Number} height
		 * @return {Number} A numeric value, should be used with 'px' unit.
		 * @example //assuming an SD application
		 * av.dom.toAbsHeight('50%');//240
		 */
		toAbsHeight : function(height){
			var h = 0;
			//calculate top
			if(height.toString().indexOf('%') != -1){
				h = av.dom.putOnGrid( parseFloat(height)/100*av.height);//convert to a % of the height
			}else{
				h = av.dom.putOnGrid(parseInt(height));
			}
			
			return parseInt(h);
			
		},
		/**
		 * Given the width of the current page, we convert the 'width' argument into an absolute (px-based) number and return that number
		 * @return {Number} A numeric value, should be used with 'px' unit.
		 * @example //assuming an SD application
		 * av.dom.toAbsWidth('50%');//320
		 */
		toAbsWidth : function(width){
			var w = 0;
			//calculate top
			if(width.toString().indexOf('%') != -1){
				var relWidth = parseFloat(width,10)/100*av.width;
				
				w = av.dom.putOnGrid( relWidth);//convert to a % of the width
				//av.dom.log.debug("percent width from " + width + " is now " + w + ' and relWidth='+relWidth + ' and av.width='+av.width)
			}else{
				w = av.dom.putOnGrid(parseInt(width));
			}
			
			return parseInt(w);
		},
		/**
		 * Append an "SD" or "HD" to the string and return it, based on the current page size.
		 * @param {String} str A CSS selector name, or ID
		 */
		addSuffix : function(str){
			return str + (av.ishd ? 'HD':'SD'); 
		},
		/**
		 * Toggle all videos on the page that are present to allow for overlays, or silence; 
		 * @param {String} [onOrOff=off] "on" or "off", where "off" will pause playing videos and capture their playing state/position, "on" will resume those videos that were playing 
		 */
		toggleVideos : function(onOrOff){
			onOrOff = typeof(onOrOff) == 'string' ? onOrOff :'off';
			av.dom.log.debug('toggleVideos('+onOrOff+')');
			var videos = av.dom.getTags('video');
			av.dom.log.debug('toggleVideos() - there are ' + videos.length + ' videos');
			for(var i=0; i < videos.length; i++){
				var v = videos[i];
				//SHOW
				if(onOrOff == 'on'){
					v.style.display = v.previousStyle;
					if(typeof(v.previousState) != 'undefined' && v.previousState == 'playing'){
						//PLAY VIDEO
						v.play();
					}
					
					v.previousState = '';//reset "previousState" property
					v.previousStyle = '';
					v.previousTime = 0;
					v.previousPlaybackRate = 1;
				//HIDE
				}else{
					if(typeof(v.previousState) == 'string' && v.previousState !== '') continue;//skip, it's already hidden
					//If the 
					try{
						v.previousState = '';
						v.previousStyle = (typeof(v.style.display) != 'undefined' && v.style.display == 'none') ? 'none' : v.style.display;
						v.previousPlaybackRate = v.playbackRate;
						v.previousTime = v.currentTime;
					}catch(e){
						av.dom.log.warn("Video " +v.id + " unable to be toggled: " + e.message);
					}
					
					//Already hidden? Note it in the "previousState" property
					//And If V is NOT ( already in a non-active state, leave it as is and just hide it)
					if(v.previousStyle != 'none' && !(v.paused || v.disabled)){
						v.previousState = 'playing';
						
						//v.previousTime 	= v.currentTime; //not necessary, AVE remembers video location when pausing
						av.dom.log.debug('----------toggleVideos() - paused video: ' + v.id);
						v.pause();
					}else{
						av.dom.log.debug("------------toggleVideos() Video " + v.id + " is either invisible or it's paused/disabled... leaving alone");
					}
					v.pause();
					v.style.display = 'none';
					
				}
			}
		},
		/**
		 * Workaround for CSS rollovers, since current AVEd stitcher calculates base path of image relative to HTML doc instead of CSS file
		 * @deprecated Resolved in stitcher build 114, relative CSS paths now calculated correctly
		 */
		createRollover : function(elem, focus, unfocus,useSrc){
			var el = av.dom.get(elem);
			useSrc = typeof(useSrc) == 'boolean' ? useSrc : false;
			focus = (focus == 'none' && !useSrc ) ? 'none' : (!useSrc ? "url('" : '')+focus+(!useSrc ? "')" : '');
			unfocus = (unfocus == 'none' && !useSrc ) ? 'none' : (!useSrc ? "url('" : '')+unfocus+(!useSrc ? "')" : '');
			
			if(!el){
				return false;
			}

			el.addEventListener('focus',function(evt){
				av.dom.log.debug("focused " + el + " useSrc=" + useSrc);
				if(useSrc) el.src = focus;
				else el.style.backgroundImage = focus;
			},true);
			
			el.addEventListener('blur',function(evt){
				av.dom.log.debug("blurred " + el + " useSrc=" + useSrc);
				if(useSrc) el.src = unfocus;
				else el.style.backgroundImage = unfocus;
			},true);
			
			//Set up the initial image
			if(useSrc) el.src = unfocus;
			else el.style.backgroundImage = unfocus;
			
		},
		/**
		 * Create an HTMLElement of the desired type, setting properties, and returning it (is not appended to the DOM).
		 * @param {String} type One of the available HTML tags supported by platform: div, p, span, img, 
		 * video, button, iframe, embed, br, audio, link, textarea
		 * @param {String} [id=Empty String] A desired ID for the element in the DOM, must be unique in the current document.body
		 * @param {String} [classNames=Empty String] A space seperated list of CSS class names to assign to the element
		 * @param {String,Object} styles The styles to assign to the element, using CSS style properties (such as background-image, background-position, etc).
		 * @param {Boolean} [useDefaultPositions=false] Default positions can be used for an element if this is true, 
		 * which are essentially top/left at 0px, and width/height at 100%, any elements of the styles argument will override defaults when useDefaultPositions is true but that is set.
		 * @example var newP = av.dom.create('p','myP1','titleText page1',{'text-align':'left','left':'20%'},true);
		 * print(newP.outerHTML);
		 * //&lt;p class=&#39;titleText page1&#39; id=&#39;myP1&#39; style=&#39;height:100%; left:20%; text-align:left; top:0px; width:100%; &#39;/&gt;
		 */
		create : function(type, id,classNames,styles,useDefaultPositions){
			 var elem = av.doc.createElement(type), 
			 	 useDefaultPositions = typeof(useDefaultPositions) == 'undefined' ? false : useDefaultPositions;
			 styles = styles == undefined ? {} : styles;
			 classNames = classNames == undefined ? '' : classNames;
			 if(id) elem.setAttribute('id',id);
			 if(classNames) elem.setAttribute('class',classNames);
			
			if(typeof(styles) == 'string'){
				
				//Insert position info if not present
		 		if(useDefaultPositions){
			 		if(styles.indexOf('left:') != -1) 	styles += 'left:0px;';
			 		if(styles.indexOf('top:') != -1) 	styles += 'top:0px;';
			 		if(styles.indexOf('width:') != -1) 	styles += 'width:100%;';
			 		if(styles.indexOf('height:') != -1) styles += 'height:100%;';
		 		}
		 		
			}else{
				var stylesArray = [];
				for(style in styles){
					stylesArray.push(style + ':' + styles[style]);
				}
				//Insert position info if not present
		 		if(useDefaultPositions){
			 		if(!styles.hasOwnProperty('left')) stylesArray.push('left:0px;');
			 		if(!styles.hasOwnProperty('top')) stylesArray.push('top:0px;');
			 		if(!styles.hasOwnProperty('width')) stylesArray.push('width:100%;');
			 		if(!styles.hasOwnProperty('height')) stylesArray.push('height:100%;');
		 		}
		 		if(av.isBrowser){
			 		//av.dom.log.debug(styles);
			 		elem.setAttribute('navUp',av.getProperty(styles,'nav-up','').replace('#',''));
			 		elem.setAttribute('navRight',av.getProperty(styles,'nav-right','').replace('#',''));
			 		elem.setAttribute('navDown',av.getProperty(styles,'nav-down','').replace('#',''));
			 		elem.setAttribute('navLeft',av.getProperty(styles,'nav-left','').replace('#',''));
			 		//av.dom.log.debug('navLeft' + elem.getAttribute('navLeft'));
		 		}
				styles = stylesArray.join(';');
			}
			//rendercast cannot create style properties on the fly until appendChild is called (assumption) 		
			/*if(av.isRendercast){
				var s = styles.split(';');
				for(var i=0; i<styles.length; i++){
					var sElem = styles[i].split(':');
					elem.style[sElem[0]] = sElem[1];
				}
				//elem.setAttribute('style', styles);
			}else{*/
				elem.setAttribute('style', styles);
			//}
			
			return elem;
		},
		/**
		 * Show an HTML element by setting both the visiblity to 'visible' and the display to ''
		 * @param {String,HTMLElement} elemOrId An HTMLElement or the id of an HTML element
		 * @return {Boolean} True if node was found and could be shown, false otherwise
		 */
		show : function(elemOrId){
			var elem = av.dom.get(elemOrId);
			if(!elem) return false;
			
			elem.style.visibility = 'visible';
			
			if(elem.tagName != 'span') elem.style.display = 'block';
			return true;
		},
		
		/**
		 * Hide an HTML element by setting both the visiblity to 'hidden' and the display to 'none'
		 * @param {String,HTMLElement} elemOrId An HTMLElement or the id of an HTML element
		 * @return {Boolean} True if node was found and could be hidden, false otherwise
		 */
		hide : function(elemOrId){
			var elem = av.dom.get(elemOrId);
			if(!elem) return false;
			
			elem.style.visibility = 'hidden';
			if(elem.tagName != 'span') elem.style.display = 'none';
			return true;
		},
		
		/**
		 * Based on the distance measure defined in getNodeDistance {@link #.getNodeDistance}, findClosestNode will search for an HTMLElement that is one of the tags provided.
		 * @param {String,HTMLElement} An HTML element or id of one
		 * @param {String,Array} A comma seperated list or an Array containing tags which should be matched in this search for a closest node.
		 * @return in the order of priority dictated by the element order in the "tags" argument, along with which element in the DOM occurs first whenever 2 at the same distance are found, will be returned.
		 */
		findClosestNode : function(elem, tags){
			var elems = av.dom.getTags(tags);
			var closest = null, closestDistance = 10000000;
			for(var i=0; i<elems.length; i++){
				var curDistance = av.dom.getNodeDistance(elem, elems[i]);
				if(curDistance < closestDistance){
					closest = elems[i];
					closestDistance = curDistance;
				}
			}
			
			av.dom.log.debug('findClosestNode() - closest node was ' + closestDistance + ' away.');
			av.dom.log.debug(av.dom.getAncestors(elem).toString());
			av.dom.log.debug(av.dom.getAncestors(closest).toString());
			
			return closest;
			
		},
		/**
		 * The distance between 2 HTMLElement's is the maximum number of nodes between either and their first common ancestor
		 * @param {String,HTMLElement} elem1 The 1st element for comparison
		 * @param {String,HTMLElement} elem2 The 2nd element for comparison
		 * @return {Number} The distance between elem1 and elem2, where this distance is defined as the maximum number of nodes beteen either elem1 or elem2 to a common DOM ancestor.
		 * @example &lt;div id=&quot;topDiv&quot;&gt;
  &lt;p&gt;&lt;span id=&quot;someSpan1&quot;&gt;Text&lt;/span&gt;&lt;/p&gt;
  &lt;div&gt;
     &lt;p&gt;&lt;span id=&quot;someDeeperSpan2&quot;&gt;Text 2&lt;/span&gt;&lt;/p&gt;
  &lt;/div&gt;
&lt;/div&gt;
		 * //so the distance is whichever path is farther to the div with id "topDiv"
		 * //should result in max(2,3) = 3
		 * av.dom.getNodeDistance('someSpan1','someDeeperSpan2');
		 * //3
		 * 
		 */
		getNodeDistance : function(elem1,elem2){
			var ancestorsElem1 = av.dom.getAncestors(elem1),
				ancestorsElem2 = av.dom.getAncestors(elem2),
				maxLength = Math.max(ancestorsElem1.length, ancestorsElem2.length);
			
			var distance = 0;
			for(var i=0; i<Math.min(ancestorsElem1.length,ancestorsElem2.length); i++){
				if(ancestorsElem1[i] !== ancestorsElem2[i]) return (maxLength - i);
			}
			
			//not yet reached, then there is a problem... should at worst be the max distance to the document element
			return maxLength-1;//not inclusive of myself since the distance from me TO me == 0
		},
		/**
		 * Given an HTMLNode element or id, determine the parent ancestory of the node (document in position 0 of ancestor array returned, last element is initial elem of interest)
		 * @param {String,HTMLElement} An HTML element or id of one
		 * @return {Array[HTMLElement]} An array of HTMLElement objects, with document at position-0 and elemOrID at the last position.
		 */
		getAncestors : function(elemOrId){
			//print(elem)
			var e = av.dom.get(elem);
			if(!e){
				return [];
			}
			var ancestors = [e];
			while(true){
				ancestors.unshift(ancestors[0].parentNode);
				
				if(ancestors[0] == e.ownerDocument || !(ancestors[0] instanceof av.doc.defaultView.HTMLElement)){
					return ancestors;
				}
			}
			return ancestors;
		},
		
		/**
		 * Create a lightbox for content using an iframe. This can pause videos if needed
		 * @param {String,HTMLNodeList,HTMLElement} content Overloaded to allow the content of the lightbox to be sent in many forms; will be inserted into the lightbox div AVLightboxContent.
		 * @param {Object} settings Lightbox configuration settings.
		 * @param {Boolean} [settings.toggleVideos=true] When showing a lightbox, video overlays have unexpected behavior, set this to false to enable videos on the page to not be 
		 * @param {Number} [settings.opacity=0] 10, 20,... 100 - the opacity of the lightbox's grey background; Leave as 0 to function as a dialogue overlay (i.e. no greyed out look of the page)
		 * @param {String} [settings.width=60%] How wide, in % or px, the lightbox should be (relative to the page).
		 * @param {String} [settings.height=60%] How tall, in % or px, the lightbox should be (relative to the page).
		 * @param {String} [settings.top=false] A pixel or percent position of where to place the left side of the LightBox, false means to use the default.
		 * @param {String} [settings.left=false] A pixel or percent position of where to place the left side of the LightBox, false means to use the default.
		 * @param {String,HTMLElement} [settings.focus=Close Button] What should be given focus when the lightbox is shown? The close button or something in your content inserted into the lightbox? (id or DOM element).
		 * @param {String} [settings.lightboxClass=Empty String] A CSS class to be applied to the outer 'ui' container so that you can override styles.
		 * @param {Boolean} [settings.useCloseButton=true] Should we create a close button at the top left that is chaseable? (you can change the positioning using CSS)
		 * @param {Boolean} [settings.throwAway=true] When the LightBox.close() method is called, should we destroy this LightBox or just hide it?
		 * True will destroy it, false will just av.dom.hide() it so that we can LightBox.show() again later (perhaps with new content as is the case in a confirm/alert that is reused throught the application)
		 * 
		 * @returns {LightBox}
		 */
		createLightbox : function(content, settings){
			var lightboxPrefix = 'AVLightbox';
			av.dom.index++;//keeps track of unique UI ids so that we never re-use an index
			var lightboxId = lightboxPrefix + av.dom.index;
			var closeId = lightboxId + 'Close';
			
			//defaults to merge with the provided settings
			var defaults = {
				toggleVideos: true,
				opacity		: 0,
				width		: '60%',
				height		: '60%',
				focus		: false,
				lightboxClass	: '',
				top			: false,
				left		: false,
				useCloseButton	: true,
				throwAway	: true,
			};
			
			
			settings = typeof(settings) === 'object' ? av.mergeObjects(defaults,settings, false) : defaults;
			settings.width = av.dom.toAbsWidth(settings.width);
			settings.height = Math.min(16 + av.dom.toAbsHeight(settings.height), av.height);//go 16px larger to accomodate the close button
			
			//calculate top
			var top = av.dom.putOnGrid((av.height - av.dom.toAbsHeight(settings.height))/2);
			top = Math.max(0,top-16);
			
			//calculate left
			var left = av.dom.putOnGrid((av.width - av.dom.toAbsWidth(settings.width))/2);
			
			settings.top = typeof(settings) === 'object' && settings.top ? av.dom.toAbsHeight(settings.top) : top;
			settings.left = typeof(settings) === 'object' && typeof(settings.left) == 'string' ? av.dom.toAbsWidth(settings.left) : left;
			settings.outerHeight = settings.height;//the outer height takes on the height, while the innerHeight is 16 under that 
			settings.height = Math.max(16,settings.height-16);
			
			settings.focus = settings.focus ? settings.focus : closeId,//focus stays on the 'Close' button if not defined
			
			av.dom.log.debug("Lightbox settings:");
			av.dom.log.debug(settings);
			
			//calculate opacity filter between 10 and 100, in increments of 10
			settings.opacity = typeof(settings.opacity) === 'number' ? settings.opacity : 80;
			settings.opacity = Math.min(100,Math.ceil(settings.opacity/10)*10);//round to the nearest 10
			
			/**
			 * @name LightBox
			 * @class
			 */
			var lightbox = {
					/**
					 * The string used as the prefix for the LightBox id and CSS class name.
					 * @property
					 * @name LightBox.prefix
					 * @memberOf LightBox#
					 * @type String
					 */
					prefix 	: lightboxPrefix,
					
					/**
					 * A unique identifier assigned to this LightBox in relation to how many
					 * LightBoxes have been created throughout the static presence of av.dom
					 * in the application; also used as the prefix for each of the id's in the DOM
					 * of the various pieces of the LightBox, such as the UI container, ContentHolder,
					 * etc.
					 * @property 
					 * @name LightBox.id
					 * @memberOf LightBox#
					 * @type String
					 */
					id		: lightboxId,
					
					/**
					 * Whether the LightBox is HD or SD
					 * @property 
					 * @name LightBox.type
					 * @memberOf LightBox#
					 * @type String
					 */
					type	: av.ishd ? 'HD':'SD', 
					
					/**
					 * An object of the settings through which this LightBox was instantiated with
					 * @property 
					 * through av.dom.createLightbox(content, settings);
					 * @name LightBox.settings
					 * @memberOf LightBox#
					 * @type Object
					 */
					settings: settings,
					
					/**
					 * The active element on the page to focus when the LightBox is closed.
					 * @property
					 * @name LightBox.parentFocus
					 * @memberOf LightBox#
					 * @type HTMLElement
					 */
					parentFocus : av.doc.activeElement,
					
					/**
					 * The ID of the close button on the LightBox, if any.
					 * @property
					 * @name LightBox.closeButton
					 * @memberOf LightBox#
					 * @type String
					 */
					closeButton : closeId,
					
					/**
					 * A handle to the LightBox DOM, not inclusive of the outer screenshot/lightbox grey area.
					 * @property
					 * @name LightBox.dom
					 * @memberOf LightBox#
					 * @type HTMLElement
					 */
					dom : null,
					
					/**
					 * A handle to the LightBox UI top level, this is the ancestor of all content in the LightBox and can be traversed and modified.
					 * @property
					 * @name LightBox.domAll
					 * @memberOf LightBox#
					 * @type HTMLElement
					 */
					domAll : null,
					
					/**
					 * A handle to the LightBox Content element parent, replacing children of this element
					 * will replace all content in the middle of the LightBox (non-inclusive of the "close button").
					 * @property
					 * @name LightBox.content
					 * @memberOf LightBox#
					 * @type HTMLElement
					 */
					content : null,
					
					/**
					 * Close the LightBox, and depending on the setting at createLightbox time settings.throwAway, either destroy it or just hide it.
					 * @memberOf LightBox#
					 * @function
					 * @name LightBox.close
					 */ 
					close:function(){
						av.dom.log.debug("Closing lightbox");
						var onClose = typeof(settings.onClose) == 'function' ? settings.onClose : function(){};
					
						if(!settings.throwAway){
							av.dom.hide(this.domAll);
							av.dom.log.debug("Hid lightbox " + this.id);
						}else{
							var elem = this.domAll.parentNode.removeChild(this.domAll);//clean up DOM
							delete elem;
						}
						
						//restart any videos that were playing if we toggled videos
						if(this.settings.toggleVideos){
							av.dom.toggleVideos('on');
						}
						
						//focus on the previouslly active element when we close this lightbox
						//av.dom.log.debug("Parent element to focus " + this.parentFocus + " instanceof HTMLElement? " + (this.parentFocus instanceof HTMLElement));
						if(this.parentFocus){
							av.dom.log.debug("Lightbox " + this.id + " closed, focusing on " + this.parentFocus.id);
							this.parentFocus.focus();
						}
						
						onClose();
						
						if(this.settings.throwAway){
							//KILL OURSELVES (literally)
							av.dom.log.debug("Deleted lightbox " + this.id);
							for(var prop in this) delete this[prop];
							delete this;/*For one reason or another delete this does not delete this instance, so we just purge all properties*/
						}
						
					},
					
					/**
					 * Show the LightBox after close() has been called, useful for reusing a LightBox for new content without the CPU of recreating container.
					 * @param {HTMLElement,NodeList,String} Overloaded to allow any valid content to be used to replace existing content 
					 * in the LightBox; leave null or empty to reuse the content already in the LightBox.
					 * @memberOf LightBox#
					 * @function
					 * @name LightBox.show
					 */ 
					show : function(content){
						
						av.dom.log.debug("LightBox.show() - showing lightbox " + this.id);
						
						if(typeof(content) != 'undefined' && content){
							if(this.content) av.dom.replaceChildren(this.content,content);//remove content node and insert either the node, nodelist, or innerHTML
						}
						
						lightbox.parentFocus = av.doc.activeElement;//need to recapture who has current focus
						
						av.dom.show(lightbox.domAll);
						av.dom.log.debug("Focus is: " + this.settings.focus);
						if(av.dom.get(this.settings.focus)){
							av.dom.focus(lightbox.settings.focus);
						}else if(av.dom.get(this.closeButton)){
							av.dom.focus(this.closeButton);
						}
					},
					
					/**
					 * Called when keydown Event fires on the ui div.
					 * @memberOf LightBox#
					 * @function
					 * @name LightBox.onkeydown
					 * @private
					 */ 
					onkeydown:function(evt){
						//not used currently
					},
					
			};
			
			av.html.loadCss(av.themePath+"lightbox.css");
			if(lightbox.settings.toggleVideos){
				av.dom.toggleVideos('off');
			}
			
			
			var dataURL='';
			
			//Full UI, with screenshot background of current window
			var ui = av.dom.create('div',lightbox.id+'UI','AVLightboxUI '+av.dom.addSuffix('AVLightboxUI') + ' ' + settings.lightboxClass, 
				{
					'z-index':(3500+av.dom.index),
					width 	: settings.opacity ? '100%' : settings.width+'px',
					height	: settings.opacity ? '100%' : settings.outerHeight+'px',
					top 	: settings.opacity ? '0px' 	: settings.top+'px',
					left 	: settings.opacity ? '0px' 	: settings.left+'px',
				}
				
			);
			ui.addEventListener('keydown', lightbox.onkeydown,true);
			
			//Container within the UI that will hold the 	
			var bgImage = "url('"+av.themePath+"images/opacity" + settings.opacity + ".png')";
			var containerStyles = {
				
			}
			
			var container = false;
			
			if(settings.opacity){
				container = av.dom.create('div',lightbox.id+'Container',
				'AVLightboxContainer '+av.dom.addSuffix('AVLightboxContainer') + ' opacity' + settings.opacity);
			}
			
			if(settings.useCloseButton){
				var close = av.dom.create('p',closeId,'AVLightboxClose '+av.dom.addSuffix('AVLightboxClose'),{'nav-down':'#' + settings.focus},false);
				//close.src = av.themePath+'images/btn_close_d.png';//HILVERSUM chokes here
				
				//av.dom.createRollover(close, close.src.replace('_d.png','_f.png'), close.src, true)
				//av.dom.createRollover(close, av.path+"resources/images/chaser.png", 'none', false)
				
				close.addEventListener('keydown',function(evt){
					if(av.getKeyIdentifier(evt) == 'Enter'){
						av.dom.log.debug('Closing lightbox screen ' + lightbox.id);
						lightbox.close();
					}
				},true)
			}
			var icontainer = av.dom.create('div',lightbox.id+'IContainer',
					'AVLightboxIContainer '+av.dom.addSuffix('AVLightboxIContainer'),
					{
						//'background-image':"url('"+av.themePath+"images/bg_lightbox_"+av.sdhd.toLowerCase()+".png')",
						'width' 	: settings.width+'px',
						'height' 	: settings.outerHeight+'px',
						'left'		: settings.opacity ? settings.left+'px' : '0px',
						'top'		: settings.opacity ? settings.top+'px' : '0px',
					}
			);
			
			var contentHolder = av.dom.create('div',lightbox.id+'IContent',
					'AVLightboxContent '+av.dom.addSuffix('AVLightboxContent'),
					{
						'width' 	: '100%',
						'height' 	: settings.height+'px',
						'left'		: 0,
						'top'		: '16px',
					}
			);
			
			if(settings.useCloseButton) icontainer.appendChild(close);
			icontainer.appendChild(contentHolder);
			
			if(typeof(content) === 'string') contentHolder.innerHTML = content;
			else av.dom.replaceChildren(contentHolder, content);
			
			if(contentHolder.hasChildren && settings.useCloseButton){
				contentHolder.firstChild.style.navUp = '#' + closeId;//get the first element and let it chase UP to the close button
			}
			
			//lightbox
			if(container){
				container.appendChild(icontainer);
				ui.appendChild(container);//put the container in the UI
			//dialogue box === opacity0	
			}else{
				ui.appendChild(icontainer);
			}
			
			
			av.dom.log.debug("Lightbox ("+lightbox.id+"): \n"+ui.outerHTML);
			
			//Delay so that the lightbox can be drawn in HD prior to having to populate the background image, allows for considerable
			//usability improvements in HD, and introduces only a slight flicker in SD
			if(settings.opacity){
				if(av.ishd) setTimeout(function(){ui.style.backgroundImage = dataURL ? "url("+dataURL+")" : 'none';},1);
				else ui.style.backgroundImage = dataURL ? "url("+dataURL+")" : 'none';
			}
			
			lightbox.domAll = ui;
			lightbox.dom = icontainer;
			lightbox.content = contentHolder;
				var start = Date.now();
				av.dom.log.debug("createLightbox() - Appending lightbox")
			av.doc.body.appendChild(lightbox.domAll);
				av.dom.log.debug("createLightbox() - Finished appending: " + (Date.now() - start));
			
			
			av.dom.focus(lightbox.settings.focus);
			
			return lightbox;
		},
		/**
		 * Simulation of Firefox/Safari/IE alert() interface for the AV Platform
		 * @param {String} str The text to present to the viewer.
		 * @param {String} [buttonText=OK] The text to display on the button that closes the alert() box. 
		 * @param {LightBoxSettings} settings This is the same as the settings object for createLightbox {@link #.createLightbox} except it adds 1 setting (settings.onConfirm() is a function called when OK is clicked).
		 * @returns {LightBox}
		 */ 
		alert : function(str, buttonText, settings){
			buttonText = typeof(buttonText) == 'string' && buttonText !== '' ? buttonText : 'OK';
			if(settings === undefined) settings = {};
			
			
			av.dom.index++;
			var buttonId = 'AVAlertButton'+av.dom.index;
			
			var requestedHeight = typeof(settings.height) != 'undefined' ? av.dom.toAbsHeight(settings.height) : 0;
			
			var height = requestedHeight ? av.dom.putOnGrid(requestedHeight) : av.dom.putOnGrid(16 * ((str.length/20) + 3)); //extra 2 lines for the button + 1 for padding
			var lightboxText = av.dom.create('p','AVAlertText'+av.dom.index,'AVAlertText ' + av.dom.addSuffix('AVAlertText'),{height:(height-32)+'px',},true)
				lightboxText.appendChild(av.doc.createTextNode(str));
			
			var button = av.dom.create('button',buttonId,'AVLightboxButton ' + av.dom.addSuffix('AVLightboxButton'),{top:(height-32)+'px', left:'60%'},false)
				av.dom.log.debug("alert button width " + button.style.width);
				button.appendChild(av.doc.createTextNode(buttonText))
				//av.dom.createRollover(button,av.themePath +"images/btn_f.png",av.themePath+"images/btn_d.png",false)
			
			var settingsFinal = av.mergeObjects({width:'40%',height:height+'px',focus:buttonId}, settings,true);
				
			var lightbox = av.dom.createLightbox([lightboxText,button], settingsFinal)
			
			button.style.navUp = '#'+lightbox.closeButton;
			button.style.left = (lightbox.settings.width - (av.issd ? 80 : 112))+'px';
			button.addEventListener('keydown',function(evt){
				if(av.getKeyIdentifier(evt) == 'Enter'){
					lightbox.close.apply(lightbox,[]);
					evt.stopPropagation();
					evt.preventDefault();
					if(typeof(settings.onConfirm) == 'function'){
						settings.onConfirm();
					}
				}
			},true)
			
			
			
			//lightbox.dom.appendChild(button);
				
			return lightbox;
			
		},
		/**
		 * Simulation of Firefox/Safari/IE confirm() interface for the AV Platform
		 * @param {LightBoxSettings} settings This is the same as the settings object for createLightbox {@link #.createLightbox} except it adds 2 settings (settings.onConfirm() is a function called when OK is clicked, and settings.onCancel() is called on CANCEL click).
		 * @example av.dom.confirm("Are you sure you want to do that?", null, {throwAway:false,});
		 * //results in the following HTML
		 * 
		 * &lt;div class=&#39;AVLightboxUI AVLightboxUISD&#39; id=&#39;AVLightbox2UI&#39;
style=&#39;height:100%; left:0px; top:0px; width:100%; z-index:3502;&#39;&gt;
  
  &lt;div class=&#39;AVLightboxContainer AVLightboxContainerSD opacity90&#39;
  id=&#39;AVLightbox2Container&#39; style=&#39;&#39;&gt;
    
    &lt;div class=&#39;AVLightboxIContainer AVLightboxIContainerSD&#39;
    id=&#39;AVLightbox2IContainer&#39;
    style=&#39;height:80px; left:192px; top:192px; width:256px;&#39;&gt;
      
      &lt;p class=&#39;AVLightboxClose AVLightboxCloseSD&#39;
      id=&#39;AVLightbox2Close&#39; style=&#39;nav-down:#AVAlertButtonYes1;&#39; /&gt;
      
      &lt;div class=&#39;AVLightboxContent AVLightboxContentSD&#39;
      id=&#39;AVLightbox2IContent&#39;
      style=&#39;height:64px; left:0; top:16px; width:100%;&#39;&gt;
        
        &lt;p class=&#39;AVAlertText AVAlertTextSD&#39; id=&#39;AVAlertText1&#39;
        style=&#39;height:32px; left:0px; top:0px; width:100%;&#39;&gt;are you
          sure?&lt;/p&gt;
          
        &lt;button class=&#39;AVLightboxButton AVLightboxButtonSD&#39;
        id=&#39;AVAlertButtonNo1&#39;
        style=&#39;left:20%; nav-right:#AVAlertButtonYes1; top:32px;&#39;&gt; CANCEL&lt;/button&gt;  
        
        &lt;button class=&#39;AVLightboxButton AVLightboxButtonSD&#39;
        id=&#39;AVAlertButtonYes1&#39;
        style=&#39;left:60%; nav-left:#AVAlertButtonNo1; top:32px;&#39;&gt; OK&lt;/button&gt;
      
      &lt;/div&gt;
      
    &lt;/div&gt;
    
  &lt;/div&gt;
  
&lt;/div&gt;
		 */
		confirm : function(str, buttonYesText, buttonNoText, settings){//settings needs an onConfirm and onCancel event listener
			buttonYesText = typeof(buttonYesText) == 'string' && buttonYesText !== '' ? buttonYesText : 'OK';
			buttonNoText = 	typeof(buttonNoText)  == 'string' && buttonNoText !== ''  ? buttonNoText  : 'CANCEL';
			
			if(settings === undefined) settings = {};
			
			
			av.dom.index++;
			var buttonYesId = 'AVAlertButtonYes'+av.dom.index;
			var buttonNoId  = 'AVAlertButtonNo'+av.dom.index;
			
			var requestedHeight = typeof(settings.height) != 'undefined' ? av.dom.toAbsHeight(settings.height) : 0;
			
			var height = requestedHeight ? av.dom.putOnGrid(requestedHeight) : av.dom.putOnGrid(16 * ((str.length/20) + 3)); //extra 2 lines for the button + 1 for padding
			var lightboxText = av.dom.create('p','AVAlertText'+av.dom.index,'AVAlertText ' + av.dom.addSuffix('AVAlertText'),{height:(height-32)+'px',},true)
				lightboxText.appendChild(av.doc.createTextNode(str));
			
			var buttonYes = av.dom.create('button',buttonYesId,'AVLightboxButton ' + av.dom.addSuffix('AVLightboxButton'),{top:(height-32)+'px', left:'60%','nav-left':'#'+buttonNoId},false)
				buttonYes.appendChild(av.doc.createTextNode(buttonYesText))
			
			var buttonNo = av.dom.create('button',buttonNoId,'AVLightboxButton ' + av.dom.addSuffix('AVLightboxButton'),{top:(height-32)+'px', left:'20%','nav-right':'#'+buttonYesId},false)
				buttonNo.appendChild(av.doc.createTextNode(buttonNoText))
			
			var settingsFinal = av.mergeObjects({width:'40%',height:height+'px',focus:buttonYesId}, settings,true);
				
			var lightbox = av.dom.createLightbox([lightboxText,buttonYes, buttonNo], settingsFinal)
			av.dom.log.debug("lightbox settings");
			av.dom.log.debug(settingsFinal);
			av.dom.log.debug(settings);
			
			buttonYes.style.navUp = buttonNo.style.navUp = '#'+lightbox.closeButton;
			buttonYes.style.left = (lightbox.settings.width - (av.issd ? 80 : 112))+'px';
			buttonNo.style.left = (lightbox.settings.width - (av.issd ? 160 : 224))+'px';
			
			buttonYes.addEventListener('keydown',function(evt){
				if(av.getKeyIdentifier(evt) == 'Enter'){
					av.dom.log.debug("confirm selection was OK")
					lightbox.close.apply(lightbox,[]);
					evt.stopPropagation();
					evt.preventDefault();
					if(typeof(settings.onConfirm) == 'function'){
						settings.onConfirm();
					}
				}
			},true)
			
			buttonNo.addEventListener('keydown',function(evt){
				if(av.getKeyIdentifier(evt) == 'Enter'){
					av.dom.log.debug("confirm selection was CANCEL")
					lightbox.close.apply(lightbox,[]);
					evt.stopPropagation();
					evt.preventDefault();
					if(typeof(settings.onCancel) == 'function'){
						settings.onCancel();
					}
				}
			},true)
			
			//lightbox.dom.appendChild(button);
				
			return lightbox;
		},
		
		/**
		 * Stop and event by calling evt.stopPropagation() on the event and evt.preventDefault()
		 * @return {Boolean} The result of evt.preventDefault()
		 */
		stopEvent : function(evt){
			try{
				evt.stopPropagation();
				return evt.preventDefault();
			}catch(eNotReallyAnEvent){ return false;}
		},
		
		/**
		 * Given an elem, then going in the direction "direction", what would be considered the x/y of the element to the 
		 * nearest edge on that side. Preference is given:
		 * 		right --> center-left
		 *  	up --> mid-bottom
		 *  	left --> center-right 
		 *  	down --> mid-top
		 * 
		 *  	Calculation algorithm used is that recommended by MDN (reference to MSDN) and the MSDN:
		 *  	http://msdn.microsoft.com/en-us/library/ms530302(VS.85).aspx
		 * 
		 *  Note here that "direction" is the direction you are coming, so "right" refers to an element chasing to the right
		 *  toward this elem, hence it would actually be the "left side" of the elem we want x/y for if direction==="right"
		 */
		getXY : function(elem, direction){
			var x, y;
			var elem = av.dom.get(elem);
			var box = elem.getBoundingClientRect();
			var win = av.doc.defaultView;
			var px = win.pageXOffset, py = win.pageYOffset;
			var halfHeight = (box.bottom-box.top)/2;
			var halfWidth = (box.right-box.left)/2;
			
			switch(direction){
			 	case 'right':
					x = px + box.left;
					y = py + box.top + halfHeight;//the midpoint vertically
					break;
				case 'top-right':
					x = px + box.right;
					y = py + box.top;
					break;
				case 'top-left':
					x = px + box.left;
					y = py + box.top;
					break;	
				case 'up':
					x = px + box.left + halfWidth;
					y = py + box.bottom;
					break;
				case 'left':
					x = px + box.right;
					y = py + box.top + halfHeight;//the midpoint vertically
					break;	
				case 'down':
					x = px + box.left + halfWidth;
					y = py + box.top;
					break;
				case 'bottom-right':
					x = px + box.right;
					y = py + box.bottom;
					break;
				case 'bottom-left':
					x = px + box.left;
					y = py + box.bottom;	
			}
			
			return {
				x : x,
				y : y
			}
		},
		
		/**
		 * Makes it logically easier to use the getXY function for external users
		 */
		getCoordinates : function(elem, side){
			av.dom.log.debug(side)
			var sides = {//maps to either left, right, up, down, or the corners (bottom-right, bottom-left, top-right, top-left)
				'right' : 'left',
				'left'  : 'right',
				'top' 	: 'down',
				'bottom': 'up',
				'down'	: 'up',
				'up'	: 'down',
				
				//headed upward on eight left or right side
				'top-left':'bottom-left',
				'top-right':'bottom-right',
				'up-left' : 'bottom-left',
				'up-right' : 'bottom-right',
				
				//headed left from either top or bottom corner
				'left-top' : 'top-right',
				'left-up'	: 'top-right',
				'left-bottom' : 'bottom-right',
				'left-down'	 : 'bottom-right',
				
				//headed  down from either the left or right corner
				'down-left' : 'top-left',
				'bottom-left':'top-left',
				'down-right': 'top-right',
				'bottom-right':'top-right',
				
				//headed right from either the top or bottom corner
				'right-bottom' : 'bottom-right',
				'right-down' : 'bottom-right',
				'right-top' : 'top-left',
				'right-up' : 'top-left'
			};
			if(!sides[side]){
				var s = []; for(var prop in sides){s.push(prop);}
				throw new TypeError("av.dom.getCoordinates(elem, side) expects argument 2 to be " + s.join('/') + ". Received:" + side);
			}
			return av.dom.getXY(elem, sides[side]);
		},
		
		/**
		 * Determine if an element is visible or not, with an optional ability to do a simple check (not recursing)
		 * @param {String,DOMElement} elemOrId The id of an element or a reference to an element itself
		 * @param {Boolean} [recurse=true] Should we limit this to the node itself, or navigate back up the DOM tree to make sure
		 * each of the parents is visible as well?
		 * @example <style>div{display:none;}</style>
		 * <div>
		 * 		I am a div <button id="button1">I am a button</button>
		 * </div>
		 * <button id="button2">I am a button</button>
		 * <script><!--
		 * 	 console.log(av.dom.visible(document.querySelector('div')));
		 *	 //false - as the div is hidden in the <style> tag
		 * 
		 * 	 console.log(av.dom.visible(document.querySelector('#button1'))   );
		 *	 //false - since parent was div hidden
		 * 	 
		 *   console.log(av.dom.visible(document.querySelector('#button1'), false)   );
		 *	 //true - since we told .visible not to look above to parent with 2nd argument recurse===false
		 *   
		 * 	 console.log(av.dom.visible(document.querySelector('#button2')));
		 *	 //true
		 * --></script>
		 */
		visible : function(elemOrId, recurse){
			var obj = av.dom.get(elemOrId);
			var recurse = typeof(recurse) == 'boolean' ? recurse : true;
			//console.log('obj', obj);
			
		    if (obj == av.doc) return true
		
		    if (!obj) return false
		    if (!obj.parentNode) return false
		    
		    if (obj.style) {
		        if (obj.style.display == 'none') return false
		        if (obj.style.visibility == 'hidden') return false
		    }

	        var style = window.getComputedStyle(obj, "")
	        if (style.display == 'none') return false
	        if (style.visibility == 'hidden') return false

			
		    return recurse ? av.dom.visible(obj.parentNode, recurse) : true;
		},
		
		/**
		 * Scroll an element into the visible area on the page, optionally focusing it once it is in view as well
		 * @param {String,HTMLElement} An element or id of an element to scroll into view
		 * @param {Boolean} [focus=false] If true, will focus the element once it is within the visible area on screen
		 */
		scrollIntoView : function(elemOrId, focus){
			var yChangeNeeded = xChangeNeeded = 0;
			var elem = av.dom.get(elemOrId);
			var focus = typeof(focus) == "boolean" ? focus : false;
			
			if(!elem){return false;}
			var coordinates = elem.getBoundingClientRect();
			
			//vertical scroll
			if(coordinates.top < 0){
				yChangeNeeded = coordinates.top;//scroll down
			}else if(coordinates.bottom > av.height){
				yChangeNeeded = -(av.height - coordinates.bottom);
			}
			
			//horizontal scroll
			if(coordinates.left < 0){
				xChangeNeeded = coordinates.left;
			}else if(coordinates.right > av.width){
				xChangeNeeded = -(coordinates.right - av.width);
			}
			
			av.dom.log.debug(coordinates, "Would have moved left " + xChangeNeeded + "px and down " + yChangeNeeded + "px");
			
			var yChangeMade = 0
			var xChangeMade = 0;
			while((xChangeNeeded != xChangeMade || yChangeNeeded != yChangeMade) && (elem.offsetParent && elem.offsetParent != av.doc)){
				var elem = elem.offsetParent;//parentNode?
				
				var horizontalMove = xChangeNeeded - xChangeMade;
				var verticalMove = yChangeNeeded - yChangeMade;
				av.dom.log.debug("horizontalMove="+horizontalMove+", verticalMove="+verticalMove);
				
				if(elem.scrollTop && verticalMove){				
					elem.scrollTop += verticalMove;
					yChangeMade += horizontalMove;
				}
				
				if(elem.scrollLeft && horizontalMove){
					elem.scrollLeft += horizontalMove;
					xChangeMade += horizontalMove;
				}
				
			}
			//console.log([yChangeMade, yChangeMade])
			if(focus){
				av.dom.focus(elemOrId);
			}
			if(window.event){
				window.event.preventDefault();
			}
			return [yChangeMade, yChangeMade];
		}
		
		
	}//end avdom
})(av);