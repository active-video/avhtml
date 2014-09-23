/**
 * @fileoverview Provides navigational flow logic for applications based on proximity to elements in the same navigation group
 */
if(!av.exists('av.Navigation')){
	av.require('dom');
	
	/**
	 * Creates a new navigation flow object, sometimes called a "chase-map".
	 * @class <p>The av.Navigation class is available to ease in adding navigation to HTML pages
	 * and to allow developers some level of automation in creating navigation flows.</p>
	 * 
	 * <p>Often times an application will have "state" associated with navigations, such as
	 * statements like "if the user has not yet selected a category, then the down arrow should jump
	 * to the help section, otherwise focus the playlist". In these cases, they may 
	 * have complex and unpredictable navigation flows that are not possible to automatically
	 * detect.</p>
	 * 
	 * <p>The av.Navigation class provides several utilities to add elements individually,
	 * add all elements with given matching CSS-selectors, or to add everything in a page
	 * that (were it on the web) would be focusable when tabbing through a page.</p>
	 * 
	 * <p>As such, this library will allow the developer using it to create simple to moderately
	 * complex navigation flows without having to rewire all of the event handlers
	 * that become redundant in each and every page of an application. </p>
	 * @requires {av.dom}
	 */
	av.Navigation = function(){
		var self = this;
		self.log = new av.Log(av.getEffectiveLogLevel('navigation'),'av.navigation');
		
		var count = 0;
		
		/**
		 * The elements that are currently a part of this navigation map, an array of objects with properties elem/navRight/navLeft/navUp/navDown
		 * @memberOf av.Navigation#
		 * @name av.Navigation.elements
		 * 
		 * @type Object[Object]
		*/
		self.elements = {};
		
		/**
		 * The current exits from the navigation map in the directions up/down/left/right
		 * @memberOf av.Navigation#
		 * @name av.Navigation.exits
		 */
		self.exits = {};
		
		
		/**
		 * MODES.midpoint will cause navigation to be done with respect to the midpoint of the edge
		 * orthogonal to the direction movement is heading; MODES.natural will use top-to-bottom, left-to-right
		 * reading order; 
		 * 
		 * @memberOf av.Navigation#
		 * @default "{<br />midpoint:{right:'right',left:'left',up:'up',down:'down',},<br />natural:{right:'right-top',left:'left-top',up:'up-left',down:'bottom-left'}<br />}"
		 * @type Object[Object]
		 */
		self.MODES = {
			'midpoint' : {
				'right' : 'right',
				'left'	: 'left',
				'up'	: 'up',
				'down'	: 'down' 
			},
			'natural' : {
				'right'	: 'right-top',
				'left'	: 'left-top',
				'up'	: 'up-left',
				'down'	: 'bottom-left'
			}
		}
		/**
		 * @private
		 */
		var mode = av.getConfigValue('Navigation.mode','natural');
		
		/**
		 * window.config.Navigation.mode can be either a string or the object
		 * describing which edge/corner should be used when navigating in the
		 * direction of the keys (right/left/up/down)
		 * 
		 * @property 
		 * @propertyOf av.Navigation#
		 * @type String
		 */
		self.mode = typeof(mode) == 'string' ? self.MODES[mode] : mode;
		
		/**
		 * Accepts a variable list of arguments, either an Array of elements/ids or an element/id per argument; will
		 * add each element to the chaseable elements. 
		 * 
		 * Arguments must be an element or an id of an HTMLElement, or a configuration object of the form:
		 * {	
		 * 		elem: HTMLElement-or-id, 
		 * 		param1 : param1Value,
		 * 		...
		 * }
		 * 
		 * @name av.Navigation.add
    	 * @methodOf av.Navigation#
    	 * 
    	 * @param {String,Array[String,Object]} elemObjOrArray1 overloaded to accept an HTML element or ID of an element; 
    	 * 		  If an object is provided, it is assumed that the object.elem property is an HTMLElement or ID of one; 
    	 * 		  if an array is provided then it should be an array of elements or objects each being either an HTMLElement
    	 * 		  or ID of one or an Object with an Object.elem property that is. 
    	 * @param {String,Array[String,Object]} elemObjOrArray2 
    	 * @param {String,Array[String,Object]} elemObjOrArrayN
		 */
		self.add = function(elemObjOrArray){
			if(elemObjOrArray != undefined && elemObjOrArray instanceof Array){
				self.add.apply(self, elemObjOrArray);
				return true;
			}
			if(arguments.length){
				for(var i=0; i<arguments.length; i++){
					//each element can either be a reference/handle to an actual HTML element, or a configuration of 
					//an element: {elem:HTMLElement-or-id, param1 : param1Value,...}
					var htmlElem, navRight = '', navLeft = '', navUp = '', navDown = '';
					var elem = arguments[i];
					
					if(elem && (elem instanceof String || elem instanceof av.doc.defaultView.HTMLElement)){
						htmlElem = av.dom.get(arguments[i]);
					}else{
						htmlElem = av.dom.get(arguments[i].elem);
						navRight 	= arguments[i] && arguments[i].navRight ? arguments[i] && arguments[i].navRight !== undefined : '';
						navDown 	= arguments[i] && arguments[i].navDown ? arguments[i] && arguments[i].navDown !== undefined : '';
						navLeft 	= arguments[i] && arguments[i].navLeft ? arguments[i] && arguments[i].navLeft !== undefined : '';
						navUp 		= arguments[i] && arguments[i].navUp ? arguments[i] && arguments[i].navUp !== undefined : '';
					}
					if(!htmlElem){						
						throw new TypeError("Cannot add element #" + i + " to the av.Navigation chase map, expected a DomID or HTMLElement or Configuration object of the form {elem:HTMLElement,...} but received: " + HTMLElement);
					}
					
					//each element should have an ID, so that we can refer to it
					var id = htmlElem.id;
					if(!id){
						id = 'navigationElement' + av.dom.index;
						htmlElem.setAttribute('id', id);
						av.dom.index++;
					}
					//for non-form elements, and form elements, make sure they have a "tabindex" property
					if(!htmlElem.hasAttribute('tabindex') && ("button,select,input,").indexOf(htmlElem.nodeName.toLowerCase()+",") == -1){
						htmlElem.setAttribute('tabindex', 0);//to be natively focusable, each element must have a tabindex if it is not focusable
					}
					count++;
					self.elements[id] = {
						elem : htmlElem,
						x : 0,
						y : 0,
						height : 0,
						width: 0,
						right : navRight,
						down : navDown,
						left : navLeft,
						up : navUp
					};
					self.setupListener(self.elements[id]);
				}
			}	
		}
		
		/**
		 * 
		 * Remove the elements referenced in the parameters from the current navigation map and 
		 * remove any event listeners that were assoicated with them
		 * @name av.Navigation.remove
    	 * @methodOf av.Navigation# 
    	 * 
    	 * @param {String,Array[String,Object]} elemObjOrArray1 overloaded to accept an HTML element or ID of an element; 
    	 * 		  If an object is provided, it is assumed that the object.elem property is an HTMLElement or ID of one; 
    	 * 		  if an array is provided then it should be an array of elements or objects each being either an HTMLElement
    	 * 		  or ID of one or an Object with an Object.elem property that is. 
    	 * @param {String,Array[String,Object]} elemObjOrArray2 
    	 * @param {String,Array[String,Object]} elemObjOrArrayN
		 */
		self.remove = function(elemObjOrArray){
			if(elemObjOrArray != undefined && elemObjOrArray instanceof Array){
				self.add.apply(self, elemObjOrArray);
				return true;
			}
			
			if(arguments.length){
				for(var i=0; i<arguments.length; i++){
					//each element can either be a reference/handle to an actual HTML element, or a configuration of 
					//an element: {elem:HTMLElement-or-id, param1 : param1Value,...}
					var htmlElem;
					var elem = arguments[i];
					
					if(elem && (elem instanceof String || elem instanceof av.doc.defaultView.HTMLElement)){
						htmlElem = av.dom.get(arguments[i]);
					}else{
						htmlElem = av.dom.get(arguments[i].elem);
						
					}
					//if still in dom
					if(htmlElem){
						htmlElem.removeEventListener('keydown', self.handleKeyPress, false);
					}
				}	
			}
		}
		
		/**
		 * Given string arguments, each being a CSS-Selector (http://www.w3.org/TR/selectors-api/), add the 
		 * corresponding DOM elements to the navigation map
		 * 
		 * @name av.Navigation.addSelector
		 * @methodOf av.Navigation#
		 * @param {String} cssSelector1
		 * @param {String} cssSelector2
		 * @param {String} cssSelectorN
		 * 
		 * @example //Given the following HTML:
		 * //... &lt;button&gt;Button 1&lt;/button&gt;&lt;button&gt;Button 2&lt;/button&gt; ...
		 * 
		 * var n = new av.Navigation();
		 * n.addSelector('button');
		 * console.log(n.getElements());
		 * //	[
		 * //		{elem:'&lt;button id="navigationElement0"&gt;Button 1&lt;/button&gt;},
		 * //		{elem:'&lt;button id="navigationElement1"&gt;Button 2&lt;/button&gt;}
		 * //	]
		 */
		self.addSelector = function(cssSelector){
			var count = 0;
			for(var i=0; i<arguments.length; i++){
				var elems = av.doc.querySelectorAll(arguments[i]);
				if(elems.length){
					self.add.apply(self, elems);
				}
			}
			return count;
		}
		
		/**
		 * Given an id or element, find all children of that element that would normally be 
		 * focusable in a browser (button,input:not([type=hidden]), select, textarea, *[tabindex])
		 * and add them to the navigation map.
		 * @param {String,HTMLElement} elemeOrId An HTMLElement or the ID of one
		 * 
		 * @name av.Navigation.addChildren
		 * @methodOf av.Navigation#
		 * 
		 * 
		 * @example //Given HTML:
		 * //&lt;div id="tweets"&gt;&lt;button&gt;Tweet 1&lt;/button&gt;&lt;button&gt;Tweet 2&lt;/button&gt;&lt;/div&gt;
		 * 
		 * var n = new av.Navigation();
		 * var tweetDiv = document.getElementById('tweets');
		 * 
		 * n.addChildren(tweetDiv)
		 * console.log(n.getElements());
		 * //	[
		 * //		{elem:'&lt;button id="navigationElement0"&gt;Tweet 1&lt;/button&gt;},
		 * //		{elem:'&lt;button id="navigationElement1"&gt;Tweet 2&lt;/button&gt;}
		 * //	]
		 * 
		 */
		self.addChildren = function(elemOrId){
			var elem = av.dom.get(elemOrId);
			self.log.debug(elem)
			if(!elem){return false;}
			
			var elems = elem.querySelectorAll(
				'button'
				+',input:not([type=hidden])'
				+',select'
				+',textarea'
				+',*[tabindex]'
			);
			
			return self.add.apply(self, elems);
		}
		
		/**
		 * If you are feeling lucky, we can automatically add all elements in the current page to this chase
		 * map (there are no means to override though any defaults however).</p></p>This will trigger a 
		 * call to Navigation.addSelector('button,input:not([type=hidden]), select, textarea, *[tabindex]')
		 * on the current document 
		 * 
		 * @name av.Navigation.addAll
		 * @methodOf av.Navigation#
		 */
		self.addAll = function(){
			self.addChildren(av.doc);
		}
		
		/**
		 * Get the number of elements currently in this navigation map.
		 * @name av.Navigation.getCount
		 * @methodOf av.Navigation#
		 */
		self.getCount = function(){
			return count;
		}
		
		/**
		 * Get the ids of elements currently in this navigation map.
		 * @name av.Navigation.getIds
		 * @methodOf av.Navigation#
		 */
		self.getIds = function(){
			var ids = [];
			for(var id in self.elements){ids.push(id);}
			return ids;
		}
		
		/**
		 * Get the elements currently in this navigation map.
		 * @name av.Navigation.getIds
		 * @methodOf av.Navigation#
		 */
		self.getElements = function(){
			var elems = [];
			for(var id in self.elements){elems.push(self.elements[id].elem);}
			return elems;
		}
		
		/**
		 * @private
		 */
		self.handleKeyPress = function(evt){
			var key = av.getKeyIdentifier(evt);
			switch(key){
				case 'Right':
				case 'Left':
				case 'Down':
				case 'Up':					
					self.move(evt.target, key.toLowerCase());
					break;
			}
			
		}
		
		/**
		 * Given an element and a direction, move that way
		 * @name av.Navigation.move
		 * @methodOf av.Navigation#
		 * 
		 * @param {String,HTMLElement} elemOrId An HTMLElement or ID of one which currently has focus
		 * @param {String} direction The direction to navigate - one of left/right/up/down 
		 */
		self.move = function(elemOrId, direction){
			var id = typeof(elemOrId) == 'string' ? elemOrId : elemOrId.id;
			if(!self.elements[id]){return;}
			
			//now get neighbors on the desired side and see who is closest to the midpoint of this element
			var config = self.elements[id];
			
			if(config[direction] === false){return;}//navigation set to false explicitly means DO NOT NAVIGATE ANYWHERE in that direction
			else if(config[direction]){
				av.dom.focus(config[direction], true);
			}else{
				var neighbor = self.getNearestNeighbor(id, direction);
			}
			
		}
		
		/**
		 * Set the exits for any key that has no exit point explicitly set but should navigate out of the group
		 * @param {Object} directions An object with right/down/left/up properties containing the id or HTMLElement of the element
		 * that should receive focus when exiting this Navigation group in the direction specified during an av.Navigation.exit(direction)
		 * 
		 * @example var n = new av.Navigation();
		 * n.setExits({
		 * 		left : 'leftMenu',
		 * 		right: 'skyscraperAd'
		 * 		//no exits in the up/down direction, so leave out or set to empty string
		 * })
		 */
		self.setExits = function(directions){
			self.exits = directions;
		}
		
		/**
		 * 
		 * @name av.Navigation.exit
		 * @methodOf av.Navigation#
		 * @param {String} direction The direction to exit this navigation map in, if no exit exists in
		 * 		the direction given, does not have any impact
		 * @returns {Boolean} true if exit was made, false if none was defined in that direction
		 */
		self.exit = function(direction){
			if(self.exits[direction]){
				av.dom.focus(self.exits[direction], true);
				return true;
			}
			return false;
		}
		
		/**
		 * Within av.Navigation.elements, determine the closest neighbor in the direction "direction"; tie goes to the first in the elements object
		 * 
		 * @name av.Navigation.getNearestNeighbor
		 * @methodOf av.Navigation#
		 * 
		 * @param {String} id The id of the element to use as the subject of the search
		 * @param {String} direction The direction to locate the nearest neighbor in, will use the search direction 
		 * 		in that direction provided by self.mode[direction], so that for navigation say in the left direction, you 
		 * 		can search for the closes element from the top-left corner of the DOM node id
		 */
		self.getNearestNeighbor = function(id, direction){
			var bestMatch, distanceBest=Infinity;
			
			//get the midpoint on the edge in the direction we are going, so if going down get the bottom-midpoint
			var elemPosition = av.dom.getCoordinates(id, self.mode[direction]);
			
			for(var neighborId in self.elements){
				if(neighborId == id){continue;}//can't chase to self
				var neighbor = self.elements[neighborId];
				
				//@TODO should we do a recursive visibility check? For now, simply checking the node itself 
				//is computed as visible.
				if(!av.dom.visible(neighbor.elem, true)){continue;}
				
				var position = av.dom.getCoordinates(neighbor.elem, self.mode[direction]);//get the x/y coordinates when calculated to the midpoint of the nearest edge in direciton "direction" from "id"
				
				//euclidean distance
				var distance = Math.sqrt(Math.pow(position.y - elemPosition.y, 2) + Math.pow(position.x - elemPosition.x,2));
				
				//Exclude elements that are not directionally in the direciton that we are headed
				switch(direction){
					case "right":
						if(position.x <= elemPosition.x){continue;}
						break;
					case "down":
						if(position.y <= elemPosition.y){continue;}
						break;
					case "left":
						if(position.x >= elemPosition.x){continue;}
						break;
					case "up":
						if(position.y >= elemPosition.y){continue;}
						break;
				}
				self.log.debug("Neighbor in direction " + direction +" with id=" + neighborId + " is " + distance + " pixels away, at position", position)
				if(distance < distanceBest){
					bestMatch = neighbor;
					distanceBest = distance;
				}
			}
			
			//make sure that after focusing, or if nowhere else to focus, that we 
			//cancel any navigation key presses from 
			//scrolling the page, lest an element be the end of the list
			//and continuous keypresses scroll the page if 
			//another div overflows
			if(bestMatch){
				av.dom.focus(bestMatch.elem, true);
			}else if(window.event){
				window.event.preventDefault();
				
				if(self.exits[direction]){
					av.dom.focus(self.exits[direction]);
				}
				
			}
			
		}
		
		/**
		 * @private
		 */
		self.setupListener = function(navElement){
			navElement.elem.removeEventListener('keydown', self.handleKeyPress, false);
			navElement.elem.addEventListener('keydown', self.handleKeyPress, false);
		}
		
		/**
		 * Only to be called if preceeded by a call to the .stopListening() function, otherwise you
		 * do not need to call the listen() function as each .addXYZ() method immediately 
		 * adds event listeners to each element added.
		 * 
		 * @name av.Navigation.listen
		 * @methodOf av.Navigation#
		 */
		self.listen = function(){
			var count=0;
			for(var elemId in self.elements){
				count++;
				//unregister previous event listeners for this navigation, since there is no easy way to 
				//detect the presence of an event listener.
				self.setupListener(self.elements[elemId]);
			}
			return count;
		}
		
		/**
		 * Remove all event listeners from each of the navigational elements that were added,
		 * to begin listening again you may call the .listen() method.
		 * 
		 * @name av.Navigation.stopListening
		 * @methodOf av.Navigation#
		 */
		self.stopListening = function(){
			var count=0;
			for(var elemId in self.elements){
				count++;
				self.elements[elemId].elem.removeEventListener	('keydown', self.handleKeyPress, false);
			}
			return count;
		}
		
	}
}
