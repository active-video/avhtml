/**
 * @fileoverview Defines a keyboard intferface
 */
(function(av){
	av.require('dom', 'string');
	
	/**
	 * @namespace <pre>Keyboard UI interface/abstraction.
	 * 
	 * To begin using, call av.require('keyboard').</pre>
	 */
	av.keyboard = {
			numKeyboards : 0,
			opposites : {
				"Up" : "Down",
				"Left" : "Right",
				"Right" : "Left",
				"Down" : "Up",
			},
			/**
			 * Version of the keyboard library.
			 */
			version		 : '1.1.0',
			
			//allows developer to turn off debug of the keyboard messages entirely even when global debug level is 0
			_debug 		 : av.getConfigValue('keyboard.logLevel',4) === 0 ? true : false,
			debug		 : function(obj){if(av.keyboard._debug){av.keyboard.log.debug(obj);}},
			
			/**
			 * @private
			 */
			keyboardConfig : {
				//(UTF-8 Boxes from http://brucejohnson.ca/SpecialCharacters.html) ▀  &#9600; {solid half-box top}	▄  &#9604; {solid half-box bottom}	▌  &#9612; {solid half-box left}	▐  &#9616; {solid half-box right} ░  &#9617; {dither light}	▒  &#9618; {dither medium}	▓  &#9619; {dither heavy}	█  &#9608; {full box}	■  &#9632; {solid medium square}	□  &#9633; {hollow medium square}	▪  &#9642; {solid small square}	▫  &#9643; {hollow small square}
				/**
				 * The default is true - should the keybaord use a cursor
				 */
				useCursor	: true,//we DO NOT use built in cursor, we implement a cursor of our own with a character from the UTF-8 charset. Otherwise, stitcher resets the cursor position to 0 every time we update the innerHTML of a <textarea>
				cursor 		: "_",
				maxCharacters: 20000,//expose all characters in the target or show only a smaller portion (for overflow)
				hideCursorAtMax : false,//hide the cursor if the max has been reached
				
				maxLength 	: false,
				cursorHTML 	: '<span class="AVKeyboardCursor">_</span>',//'<span class="avkeyboardCursor" style="color:white;">&#9608;</span>',
				
				ellipsis 	: '...',
				width		: 512,
				height		: 128, 
				padding		: 16,
				keyHeight	: 32,
				keyWidth	: 32,
				keyMarginLeft : 0,
				fakeFocus	: false,
				
				useBreadcrumbChaser : true,
				
				clickTime	: 1000,
				useSelectedStates : av.isStitcher,//use only for stitcher due to bugs with CSS in hilversum
				shiftStates		: ["&#8657;shift","CAPS","&#8659;lower"],
				
				
				keyboardClass : "",//supplemental className to add to the keyboard HTML
				keyClass	: "dark",//THEMING !!! supplemental className to add to each key HTML
				keyTag		: "button",//tag used to build up keys
				
				customPanelsFirst : false,
				defaultPanel : 0,
				defaultType : "text",//default key template
				defaultFunction : "addText",
				
				//WHICH WAY, perpendicular to the direction traveled, should focus be chased when multiple keys in the direction we're headed?
				defaultNavLeft	: 1,
				defaultNavRight : 1,
				defaultNavUp	: -1,
				defaultNavDown	: -1,
				defaultKeyStyle : '',//@todo document this property
				
				//circular navigation?
				navUp 		: '',
				navDown 	: '',
				navRight	: '',
				navLeft		: '',
				
				panels : null,
				
				eventTypes : ['keydown', 'keypress', 'keyup', 'click',
							  'beforeadd','afteradd','beforechangepanel',
							  'afterchangepanel', 'changekey'
							  ],//if you want to listen for custom event interfaces on keys, override eventTypes
							  
				functions  : {//this refers to whatever kb gets defined/used
						'backspace' : function(evt){
							this.backspace();
						},
						'moveCursorLeft' : function(evt){
							return this.moveCursorLeft();
						},
						'moveCursorRight' : function(evt){
							return this.moveCursorRight();
						},
						'moveCursorToEnd' : function(evt){
							return this.moveCursorToEnd();
						},
						'moveCursorToBeginning' : function(evt){
							return this.moveCursorToBeginning();
						},
						'addText' : function(evt){
							
							//allow listeners to stop propagation of this event
							if(!this.dispatchEvent('beforeadd', evt)){
								return false;
							}
							
							var toReturn = this.addText(evt.data);
							this.dispatchEvent('afteradd', evt);
						},
						'showNextPanel' : function(evt){
							this.changePanel(1);
							evt.stopPropagation();
							evt.preventDefault();
							return false;//stop event propagation
						},
						'clear'			: function(evt){
							this.setText('');
						},
						'shift'		: function(evt){
							this.shift(evt);
						},
						'cancel' : function(evt){
							av.keyboard.log.warn("av.keyboard.functions.cancel() - not sure what to do on cancel here, please override the cancel function within your keyboard configuration property config.functions = {cancel:function(evt){.../*Some logic here*/...}}");
						},
						'submit' : function(evt){
							av.keyboard.log.warn("av.keyboard.functions.submit() - not sure what to do on submit here, please override the submit function within your keyboard configuration property config.functions = {submit:function(evt){.../*Some logic here*/...}}");
						},
						'goToNextPanel' : function(evt){
							this.dispatchEvent('beforechangepanel',evt);
							this.changePanel(1);
							this.dispatchEvent('afterchangepanel',evt);
						},
				},
			},
			
			/**
			 * Load the keyboard templates for usage
			 */
			loadTemplates : function(){
				
				//Load the keyboard templates
				if(!av.exists('av.keyboard.templates')){}
				av.require('keyboard/templates');
				//av.keyboard.log.debug("Text template has properties: " + av.arrayKeys(av.keyboard.templates.text).join(', '));
				
			},
			
			/**
			 * Load templates if needed, and from the loaded templates return the named template
			 */
			loadTemplate : function(templateName){
				av.keyboard.loadTemplates();
				if(typeof(av.keyboard.templates[templateName]) != 'undefined'){
					return eval('('+uneval(av.keyboard.templates[templateName])+')');//pass by value, not reference
				}
				
				return '';
			},
			
			/**
			 * @param config Keyboard Configuration
			 * @param {boolean} [config.useCursor=true] Should a cursor be inserted into the text when presented in the target HTML element.
 			 * @param {string} [config.cursor  = _] description "_",
			 * @param {string} [config.maxCharacters = 20000] expose all characters in the target or limit to a certain maximum length of characters
			 * @param {string} [config.cursorHTML  = <span class="AVKeyboardCursor">_</span>] when HTML text is valid within the target (i.e. <p>) then use this HTML for the cursor.

			 * @param {string} [config.ellipsis  = ...] description '...',
			 * @param {number} [config.width = 512] The width of the keybaord
			 * @param {number} [config.height = 128] The height of the keyboard
			 * @param {number} [config.padding = 16] How much padding to insert between all 4 edges of the keyboard and the keys
			 * @param {number} [config.keyHeight = 32] The height of each key, in px, to use if not defined per key in the template
			 * @param {number} [config.keyWidth = 32] The width of each key, in px, to use if not defined per key in the template
			 * @param {number} [config.keyMarginLeft  = 0] How much empty space should be inserted to the left of each key.
			 * @param {boolean} [config.fakeFocus = false] In some situations it may be desirable to keep focus on an object such as a flash or image element, while navigating the keyboard; set fakeFocus to true if you will call the moveCursorLeft/etc functions to give the appearance of navigating the keyboard.

			 * @param {number} [config.clickTime = 1000] Not implemented, would create a setTimeout when a key was clicked to simulate a clicked state; non-efficient.
			 * @param {boolean} [config.useSelectedStates  = av.isStitcher] If stitcher, we turn on selected states
			 * @param {string[]} [config.shiftStates = "&#8657;shift","CAPS","&#8659;lower"] What symbols should be used to represent the differnt shift states (lowercase, uppercase, CAPS)

			 * @param {string} [config.keyboardClass  = empty string] supplemental className to add to the keyboard HTML
			 * @param {string} [config.keyClass = dark] THEMING !!! supplemental className to add to each key HTML className
			 * @param {string} [config.keyTag = button] tag used to build up keys, can be one of button, p, textarea.

			 * @param {boolean} [config.customPanelsFirst  = false] If merging additional panels into a template of panels, which should come first? Your's or those in the template?
			 * @param {number} [config.defaultPanel  = 0] Which panel should be shown when the keyboard is shown via show()?
			 * @param {string} [config.defaultType = text] default key template to use if no panels are received and config.type is empty.
			 * @param {string} [config.defaultFunction  = addText] What function should be called when a key is clicked if not overriden by a custom function?

			 * @param {string} [config.defaultNavLeft = 1] When navigating to the right of a key, if there is more than 1 neighbor which one should be focused? 1=the upper row, -1 = the lower row.
			 * @param {string} [config.defaultNavRight  = 1] When navigating to the right of a key, if there is more than 1 neighbor which one should be focused? 1=the upper row, -1 = the lower row.
			 * @param {string} [config.defaultNavUp = -1] When navigating to above a key, if there is more than 1 neighbor which one should be focused? -1=the left-most column, 1 = the right-most column.
			 * @param {string} [config.defaultNavDown = -1] When navigating to below a key, if there is more than 1 neighbor which one should be focused? -1=the left-most column, 1 = the right-most column.
			 * @param {DOMString} [config.defaultKeyStyle = ''] To use inline styles (not recommended) per key, set this to a DOMString.

			 * @param {string} [config.navUp  = empty string] Provide the id of an element on the page to chase up to from the keybaord; If empty, navigation up from the top row will circularly wrap again to the bottom row of the keyboard.
			 * @param {string} [config.navDown  = empty string] Provide the id of an element on the page to chase down to from the keybaord; If empty, navigation down from the bottom row will circularly wrap again to the top row of the keyboard.
			 * @param {string} [config.navRight = empty string] Provide the id of an element on the page to chase right to from the keybaord; If empty, navigation right from the right-most column will circularly wrap again to the left-most column of the keyboard.
			 * @param {string} [config.navLeft = empty string] Provide the id of an element on the page to chase left to from the keybaord; If empty, navigation left from the left-most column will circularly wrap again to the right-most column of the keyboard.

			 * @param {object[]} [config.panels  = null] panels to use for this keyboard, @see av.keyboard.templates.text.panels

			 * @param {string[]} [config.eventTypes  = 'keydown', 'keypress', 'keyup', 'click','beforeadd','afteradd','beforechangepanel','afterchangepanel'] if you want to listen for custom event interfaces on keys, override eventTypes; this would allow you to call for example, from within your custom functions, this.dispatchEvent(someCustomEvent,evt) and any listeners registered via keyboard.addEventListener('someCustomEvent',someCallbackFunction) would be notified.
			 * @param {function[]} [config.functions   = backspace, moveCursorLeft, moveCursorRight, moveCursorToEnd, moveCursorToBeginning, addText, clear, shift, cancel, submit, goToNextPanel] The function templates which can be used from any key through setting the key.uses property to the name of the function defined herein.  
			 * @example var config = av.mergeObjects(
			 * av.keyboard.loadTemplate('text'),
			 * {
			 * 	holder 	: 'keyboardHolder',
			 * 	navUp	: 'pass',
			 * 	'functions':{doSomething : function(){av.keyboard.log.debug('soSomething() - ' + this.getValue());}}
			 * }
			 * );
			 * var keyboard = av.keyboard.create(config);
			 * keyboard.show();
			 * @returns {Keyboard} a keyboard object that can be used through the {@link Keyboard} API 
			 */
			create : function(config){
				av.keyboard.log.debug("kb.create();");
				
				
				//keyboard
				var keyboardCss = av.themePath+"keyboard.css";
				av.keyboard.log.debug('Loading keyboard css: ' + keyboardCss);
				av.html.loadCss(keyboardCss);
								
				var c = {};

				//No keyboard has yet been created, and per-keyboard this method is only called once.
				var type = av.getProperty(config, 'type','');
				

				//Determine panels from (a) config panels for the given type (text, email, etc), and (b) custom panels provided
				var panels = [];
				
				var addPanels = av.getProperty(config, 'panels',[]);//additional panels
				
				av.keyboard.log.debug("panels sent in config were: " + uneval(addPanels));
				//	if there is a template TYPE requested, or there are no panels in config (in which case we must fallback on something) then 
				//LOAD THE TEMPLATE FROM keyboard/templates.js
				if(type != '' || !addPanels.length){
					av.keyboard.log.debug("create() - merge panels and configs via templates");
					type = av.getProperty(config, 'type',av.keyboard.keyboardConfig.defaultType);//if type is not present use the default
					
					av.keyboard.loadTemplates();
					
					var keyboardTemplate = av.getProperty(av.keyboard.templates,type,[]);//panels per this type
					//the requested template type for the panels is crap, load 
					if(av.getProperty(keyboardTemplate,'panels','') == ''){
						av.keyboard.log.warn("keyboard.create() - the requested template ("+type+") is not defined in keyboard/templates.js. Using " + av.keyboard.keyboardConfig.defaultType+". Please use on of the available types: " + av.arrayKeys(av.keyboard.templates).join(', '));
						keyboardTemplate = av.getProperty(av.keyboard.templates, av.keyboard.keyboardConfig.defaultType,[])
					}
					
					//Extract the panels from the template
					panels = keyboardTemplate.panels;
					
					//The keyboard template also has default properties that should be used for the keyboard
					//unless overridden by the user's config object, so pull each in (skipping over the keyboardTemplate.panels)
					for(var prop in keyboardTemplate) if(prop != 'panels') c[prop]=keyboardTemplate[prop];
					c = av.mergeObjects( av.getConfigValue('keyboard', av.keyboard.keyboardConfig) , c, true);//template overrides the keyboardConfig
					c = av.mergeObjects(c, config, true);//user config from calling create(config) overrides the template and default config options
					
				//USE THE config.panels array, don't pull in our TEMPLATES	
				}else{//hierarchy is 1st we load local config, then we load global config, then we load instance config, where latter take precedence
					av.keyboard.log.debug("create() - load from config, no templates!");
					c = av.mergeObjects(av.keyboard.keyboardConfig, config, true);//config overrides av.keyboard.keyboardConfig
					c = av.mergeObjects( av.getConfigValue('keyboard', {}) , c, true);//config then overrides window.config.keyboard
				}
				
				//push the additional panels on the end of the array
				if(addPanels.length) panels[c.customPanelsFirst ? 'unshift' : 'push'].apply(panels,addPanels);
				
				//WE SHOULD BE GOOD NOW, panels were loaded from (a) combination of template and user options, (b) just template, OR (c) just user options
				av.keyboard.log.debug('Keyboard Panels Are:');
				av.keyboard.log.debug(panels);
				
				av.keyboard.log.debug("Configuration is:");
				av.keyboard.log.debug(c);
				
				//Config settings cascade from default <-- template (if any) <-- 
				/**
				 * New instances created by calling av.keyboard.create(config)
				 * @constructor 
				 * @name Keyboard
				 */
				var keyboard = function(){
					
					var kb = this;
					kb.id = av.string.createUUID();
					/**
					 * The DOM-element target that will receive text from the keyboard as it is entered.
					 * @memberOf Keyboard#
					 * @name Keyboard.target
					 * @type HTMLElement
					 */
					kb.target = null;
					
					/**
					 * The configuration object used for this keyboard
					 */
					kb.config = c;
					
					/**
					 * The DOM-element which the keyboard is currently attached to as a DOM child.
					 * @memberOf Keyboard#
					 * @name Keyboard.holder
					 * @type HTMLElement
					 */
					kb.holder = null;
					kb.fakeFocus = av.getProperty(c,'fakeFocus',false);
					
					/**
					 * The DOM attached to this keyboard, represents the physical keyboard and is generated at run-time when Keyboard.show() is called for the first time.
					 * @memberOf Keyboard#
					 * @name Keyboard.dom
					 * @type HTMLDivElement
					 */
					kb.dom 			= null;
					
					kb.width		= null;
					kb.widthAbs	 	= null;
					kb.height		= null;
					kb.heightAbs	= null;
					kb.panels		= [];
					
					kb.lastKey 		= null;
					
					kb.objectToIntercept = null;
					
					/**
					 * The number of characters that the target will be limited to displaying at a time.
					 * @memberOf Keyboard#
					 * @name Keyboard.maxChars
					 * @type number
					 */
					kb.maxChars = av.getProperty(c,'maxCharacters',av.keyboard.keyboardConfig.maxCharacters);
					
					/**
					 * @private
					 */
					kb.init = function(){
						//link up this keyboard to the requested text target 
						if(!kb.hasTarget()) kb.setTarget(c.target);
						kb.width = c.width;
						kb.height = c.height;
						
						kb.widthAbs  = kb.toAbsPosition(kb.width.toString()+'px', 'width');//if it already has 'px' in it it'll get parsed out
						kb.heightAbs = kb.toAbsPosition(kb.height.toString()+'px', 'height');
						
						
						return kb;
					}
					
					/**
					 * Convert a string and a direction into a pixel based measurement. Returns a numeric value suitable for use with "px" or "pixels"
					 * @memberOf Keyboard#
					 * @function
					 * @name Keyboard.toAbsPosition
					 * @param {string} str A string (with a unit such as % or px) or a number to be converted.
					 * @param {string} dir "width" or "height" 
					 * @returns {number} a pixel representation of the str argument
					 */
					kb.toAbsPosition = function(str, dir){
						if(typeof(str) == 'number'){
							toReturn = str;
						}else if(str.toString().indexOf('%') != -1){
							toReturn = Math.floor((parseInt(str,10)/100) * (dir == 'left' ? kb.widthAbs : kb.heightAbs));
						}else{
							toReturn = Math.floor(parseInt(str, 10));
						}
						
						av.keyboard.log.debug("kb.toAbsPosition("+str+", "+dir+") --> " + toReturn);
						return toReturn;
					}
					
					 
					/**
					 * Shorthand for kb.toAbsPosition(str, 'width')
					 * @memberOf Keyboard#
					 * @function
					 * @name Keyboard.toAbsWidth
					 * @param {string} str A string (with a unit such as % or px) or a number to be converted to absolute width units.
					 * @returns {number} a pixel representation of the str argument
					 */ 
					kb.toAbsWidth = function(str){
						return kb.toAbsPosition(str, 'width');
					}
					
					/**
					 * Shorthand for kb.toAbsPosition(str, 'height')
					 * @memberOf Keyboard#
					 * @function
					 * @name Keyboard.toAbsHeight
					 * @param {string} str A string (with a unit such as % or px) or a number to be converted to absolute height units.
					 * @returns {number} a pixel representation of the str argument
					 */ 
					kb.toAbsHeight = function(str){
						return kb.toAbsPosition(str, 'height');
					}
					
					/**
					 * Reports whether or not a target has been set for the keyboard input.
					 * @memberOf Keyboard#
					 * @function
					 * @name Keyboard.hasTarget
					 * @returns {boolean} true if target has been set, false otherwise
					 */ 
					kb.hasTarget = function(){
						return kb.target !== null;
					}
					
					/**
					 * Reports whether or not a keyboard holder has been set for the keyboard DOM.
					 * @memberOf Keyboard#
					 * @function
					 * @name Keyboard.hasHolder
					 * @returns {boolean} true if holder has been set, false otherwise
					 */ 
					kb.hasHolder = function(){
						return kb.holder !== null;
					}
					
					/**
					 * Change the displayed keyboard panel to either the next or previous panel, wrapping at the first/last panel. 
					 * @memberOf Keyboard#
					 * @function
					 * @name Keyboard.changePanel
					 * @returns {void}
					 */ 
					kb.changePanel = function(dir){
						dir = typeof(dir) == 'number' ? dir : 1;
						kb.prevPanel = kb.curPanel;
						kb.curPanel = (kb.curPanel + kb.panels.length + dir) % kb.panels.length;
						
						av.keyboard.log.debug('kb.changePanel('+dir+') - kb.prevPanel = ' + kb.prevPanel + ', kb.curPanel=' + kb.curPanel);
						
						//hide previous panel
						av.dom.hide(kb.panels[kb.prevPanel].id);
						
						//show current panel and focus default key
						av.dom.show(kb.panels[kb.curPanel].id);
						
						//focus the default key
						var key = kb.panels[kb.curPanel].keys[kb.panels[kb.curPanel].defaultFocus];
						
						kb.focusKey(key);
						
						var evt = {data : key, target : av.dom.get(key.id)};
						kb.dispatchEvent('changekey', evt)
						
					}
					
					/**
					 * Change the displayed keyboard panel to the panel named by panelName. 
					 * @memberOf Keyboard#
					 * @function
					 * @name Keyboard.changePanelByName
					 * @param {string} panelName The key of the panel as defined in the template panels{} object
					 * @returns {boolean} True if a panel existed by the given name and was shown, false otherwise.
					 */ 
					kb.changePanelByName = function(panelName){
						kb.prevPanel = kb.curPanel;
						var panelExists = false;
						
						for(var i=0; i<kb.panels.length; i++){
							if(kb.panels[i].name == panelName){
								kb.curPanel = i;
								panelExists = true;
								break;
							}
						}
						
						if(panelExists){
							//hide previous panel
							av.dom.hide(kb.panels[kb.prevPanel].id);
							
							//show current panel and focus default key
							av.dom.show(kb.panels[kb.curPanel].id);
							
							//focus the default key
							kb.focusKey(kb.panels[kb.curPanel].keys[kb.panels[kb.curPanel].defaultFocus]);
						}
							
						return panelExists;
					}
					
					/**
					 * When text is entered/updated we trigger a native event on the current Keyboard.target, this allows developers to subscribe to "text" events on their input targets and respond to text events, whether from the keyboard or another source. 
					 * @memberOf Keyboard#
					 * @function
					 * @name Keyboard.dispatchTextEvent
					 * @returns {boolean} Returns the dispatchEvent() response, generally true unless event.preventDefault() is called during bubbling.
					 */ 
					kb.dispatchTextEvent = function(){
						var e = av.doc.createEvent("Event");//cannot use kb.target.ownerDocument because hilversum doesn't support it
						e.initEvent('text', true, true);//isCancellable = YES!!! For example, on text, the password shouldn't probably ever be displayed 
						e.source = 'Keyboard';
						e.data = kb.getValue();
				        return kb.target.dispatchEvent(e);		
					}
					/**
					 * Cursor will be moved to the end of the added text
					 */
					kb.addText = function(str, start){
						//splice out all the way up to the startPos, then add in the new "str", then finish it with the remaining original text starting from startPos
						if(typeof(start) == 'undefined') start = kb.target.cursorPosition;
						var val = kb.getValue();
						
						if(c.maxLength !== '' && typeof(c.maxLength) == 'number' && val.length >= c.maxLength){
							if(c.maxLength == val.length){return false;}
							//extract a substring up to the max length, and use it to add text
							str = str.substring(0, c.maxLength - val.length);
						}
						
						kb.target.textvalue = val.substr(0,start) + str + val.substr(start);
						
						kb.dispatchTextEvent();
						kb.target.cursorPosition = Math.max(0,start + str.length);
						
						kb.updateTextDisplay(kb.target.cursorPosition-1);//if password text we want to show the last typed character
						
						//av.keyboard.log.debug("New cursor position: " + kb.target.cursorPosition + " and is persistent: " + kb.persistentCursor)
					}
					
					/**
					 * Cursor will be moved to the end of the new text replacement
					 */
					kb.replaceText = function(str, start, length){
						av.keyboard.log.debug('kb.replaceText('+str+','+start+','+length+')');
						var origValue = kb.getValue();
						var val = origValue.substr(0,start) + str;	
						
						//keep characters at the end? If length is non-numeric, we throw away everything past start
						if(typeof(length) == 'number') val += origValue.substr(start+length)
						
						kb.target.textvalue = val;
						kb.target.cursorPosition = start + str.length
						
						kb.dispatchTextEvent();
						kb.updateTextDisplay();
					}
					
					kb.backspace = function(){
						av.keyboard.log.debug("keyboard.backspace() from " + kb.target.cursorPosition)
						//can only delete to the left of cursor, and if we're at 0 can't go farther left than that
						if(kb.target.cursorPosition > 0){
							kb.replaceText('', kb.target.cursorPosition-1,1);
						}
					}
					
					kb.shiftReverse = function(evt){
						kb.shift(evt, -1);
					}
					
					kb.shift = function(evt, dir){
						dir = typeof(dir) == 'number' ? dir : 1;
						//shiftState
						av.keyboard.log.debug('shift called from ' + evt.target);
						//av.keyboard.log.debug("kb properties: " + av.arrayKeys(kb).join(', '));
					
						kb.removeEventListener('afteradd',kb.shiftReverse, true);//remove ourselves from the shift listener, which is added whenever just shift is hit
						
					
						var panel = kb.panels[kb.curPanel];
						var curShiftState = panel.shiftState;
						
						var useCaps = (panel.shiftStates.length == 3), nextShiftState = (curShiftState + panel.shiftStates.length + dir)%panel.shiftStates.length;
						av.keyboard.log.debug("Current shiftState is (0-indexed) " + panel.shiftState + " of " + (panel.shiftStates.length-1) + " next is " + nextShiftState)
						
						//get all shift keys as there may be more than 1, otherwise we could just update the evt.target
						for(var i=0; i<panel.shiftKeys.length; i++){
							av.dom.get(panel.shiftKeys[i]).innerHTML = panel.shiftStates[nextShiftState];
						}
						
						panel.shiftState = nextShiftState;//progress it so that as far as script is converned we are NOW at nextShiftState and must make the keys match that
						
						
						var changeCase = function(func){
							for(var i=0; i<panel.keys.length; i++){
								var key = panel.keys[i];
								if(key.uses != c.defaultFunction || key.noShift) continue;//only update keys which are used for default function, @TODO use smarter logic or property on a key config to disable it from shift affecting it
								key.value = key.value[func]();
								av.dom.get(key.id).innerHTML = av.string.htmlEntities(key.value);//@TODO this is a destructive edit - no way to retrieve original value
							}
						}
						
						//Now apply the logic to the current panel
						if(panel.shiftState === 0){//need to hit shift to make all big letters for 1 Char
							changeCase('toLowerCase');
						}else if(panel.shiftState == (panel.shiftStates.length-1)){//need to make caps for all future CHARS
							changeCase('toUpperCase');
						}else if(panel.shiftState == 1){//caps lock is disabled, go back to all lower case, remove CAPS/SHIFT
							kb.addEventListener('afteradd',kb.shiftReverse, true);
							changeCase('toUpperCase');
						}
					}
					
					kb.moveCursorLeft = function(){
						av.keyboard.log.debug("keyboard.moveCursorLeft()")
						if(!kb.target.cursorPosition) return false;//if already at 0
						
						av.keyboard.log.debug("kb.target.cursorPosition = " + kb.target.cursorPosition + " , changing to " + (kb.target.cursorPosition-1));
						
						kb.setCursorPosition(kb.target.cursorPosition-1);
						av.keyboard.log.debug("moveCursorLeft() all done: pos = " + kb.target.cursorPosition);
						return true;
					}
					
					kb.moveCursorRight = function(){
						av.keyboard.log.debug("keyboard.moveCursorRight()")
						var len = kb.getValue().length;
						if(len == 0) return false;
						kb.setCursorPosition(Math.min(kb.target.cursorPosition+1, len));
						return true;
					}
					
					kb.moveCursorToEnd = function(){
						av.keyboard.log.debug("keyboard.moveCursorToEnd()")
						kb.setCursorPosition(kb.getValue().length);
						return true;
					}
					
					kb.moveCursorToBeginning = function(){
						av.keyboard.log.debug("keyboard.moveCursorToEnd()")
						kb.setCursorPosition(0);
						return true;
					}
					
					kb.functions = c.functions;
					
					kb.setCursorPosition = function(pos){
						av.dom.get(kb.target.id).cursorPosition = pos;
						av.keyboard.log.debug("setCursorPosition() - is now " + kb.target.cursorPosition);
						
						av.keyboard.log.debug("Setting cursorPosition = " + pos + " on target " + kb.target.id);
						
						kb.updateTextDisplay();
					}
					
					kb.setText = function(str){
						if(!kb.hasTarget()){
							throw new TypeError('keyboard.setText() - cannot setText because no target has been set. Call kb.setTarget(domElementOrId) first.');
						}
						kb.target.textvalue = str;
						kb.target.cursorPosition = str.length;
						av.keyboard.log.debug("cursorPosition="+kb.target.cursorPosition);
						
						kb.dispatchTextEvent();
						kb.updateTextDisplay();
						
						av.keyboard.log.debug("kb.setText("+str+" of length=" + str.length + ") - cursorPosition after complete = " + kb.target.cursorPosition );
						
						return true;
					}
					
					kb.resetText = function(){
						kb.target.textvalue = '';
						
						kb.dispatchTextEvent();
						kb.updateTextDisplay();
					}
					
					kb.getMaskedValue = function(str, showLast){
						showLast = typeof(showLast) == 'undefined' ? false : showLast;
						
					}
					
					kb.repeat = function(str, numTimes){
						var len = numTimes+1;
						//av.keyboard.log.debug("Repeat length: " + len);
						return (new Array(len)).join(str);//since joining creates only numTimes-1 copies of the concatenator, use numTimes+1 --> (numTimes+1)-1 = numTimes, exactly what we want
					}
					
					kb.setMaxCharacters = function(numChars){
						kb.maxChars = numChars;
						kb.updateTextDisplay(false, false);
					}
					
					kb.getMaxCharacters = function(){return kb.maxChars;}
					
					kb.updateTextDisplay = function(exposeCharacterInPosition, hideCursor){
						
						hideCursor = typeof(hideCursor) == 'boolean' ? hideCursor : false;
						exposeCharacterInPosition = typeof(exposeCharacterInPosition) == 'number' ? Math.max(0,exposeCharacterInPosition) : false;
						var prop = kb.target.nodeName.toLowerCase() == 'input' ? 'value' : 'innerHTML', val = kb.getValue();//only <input> uses value attribute
						var origValue = val;
						
						//@TODO update this so that the character that shows is the last one inserted
						//using addText or setText or replaceText at the cursorPosition
						if(kb.getInputType() == 'password'){
							var maskChar = av.getProperty(c,'mask','*');
							if(exposeCharacterInPosition === false){
								val = kb.repeat(maskChar, val.length)
							}else{
								av.keyboard.log.debug("maskChar="+maskChar+", val.length="+val.length+", exposeCharacterInPosition="+exposeCharacterInPosition);
								val = kb.repeat(maskChar, exposeCharacterInPosition)
									+ val.substr(exposeCharacterInPosition,1)
									+ kb.repeat(maskChar, val.length - exposeCharacterInPosition - 1);
							}
							
						}
						
						
						var cursorPosition = kb.target.cursorPosition;
						
						//If there is overflow, adapt text display for it
						//never trim more than c.cursorPositiuon from the beginning
						av.keyboard.log.debug("kb.maxChars="+kb.maxChars);
						
						var maxChars = kb.maxChars,removeFromLeft = 0, removeFromRight = 0;
						
						
						if(origValue.length > kb.maxChars){
							var overflow = origValue.length - kb.maxChars,
								cursorPosition = kb.target.cursorPosition;
							//if the cursor is past the right side of the box when full of text, make it the last character
							if(cursorPosition >= kb.maxChars){
								removeFromLeft = Math.max(0,cursorPosition - kb.maxChars + 1);
								removeFromRight = Math.max(0,overflow - removeFromLeft);
							}else{
								removeFromLeft = 0;
								removeFromRight = overflow;
							}
							
							cursorPosition = cursorPosition - removeFromLeft;//if trimmed off characters to left, now cursor is shifted 
							
							av.keyboard.log.debug("RemoveFromLeft: " + removeFromLeft +", removeFromRight:"+removeFromRight+", string length:"+origValue.length + " (" + origValue +"), " + val);
							
							val = val.substring(removeFromLeft);
							val = val.substring(0,val.length-removeFromRight);
						}
						
						//override cursor setting if max is reached and hideCursorAtMax is true
						if(c.hideCursorAtMax && c.maxLength !== '' && origValue.length >= c.maxLength){
							hideCursor = true;
						}
						
						// BELOW - we need t REMOVE HTML ENTITIES that would break attributes and innerHTML. Since we
						// do not retrieve the value from innerHTML but use av.getProperty(elem,'textvalue',''), we can
						// safely place whatever we want in that position
						if(c.useCursor && !hideCursor){
							//use HTML cursor only on simulated textarea/input via <p>, since textarea innerHTML cannot be HTML like <span> and be visible in stitcher or chrome
							//neither textarea or input can display child elements that are non-text nodes
							var cursor = ('textarea,input,').indexOf(kb.target.nodeName+',') == -1  ? c.cursorHTML  : c.cursor;
							
							av.keyboard.log.debug("Inserting cursor into string at " + cursorPosition);
							val = av.string.attributeEntities(val.substr(0,cursorPosition)).replace(/\s/g,'&#160;') + 
								  cursor + av.string.attributeEntities(val.substr(cursorPosition, val.length-cursorPosition));
						}else{
							val = av.string.attributeEntities(val).replace(/\s/g, '&#160;');
						}
						
						//Tack on the ellipsis if they are needed based on trimming of string
						if(removeFromRight) val += c.ellipsis;
						if(removeFromLeft) val = c.ellipsis + val;
						
						av.keyboard.log.debug("Updating " + kb.target.nodeName + "." + prop + " displayed text for " + kb.getValue() + " to " + val);
						
						kb.target[prop] = val;
						
					}
					
					/**
					 * Reset the keyboard for fresh use, wipe out state that would change each time you show the keyboard, like current visible panel, etc
					 */
					kb.reset = function(){
						kb.curPanel = c.defaultPanel;
						
					}
					
					kb.createPanel = function(index, pConfig){
						var width, height, className, key,
							keys = pConfig.keys,
							panelId = 'AVKeyboard'+av.keyboard.numKeyboards+"p"+index,//id for the keyboard in the DOM, dependent on index of this keyboard and index of this panel
							numCols = Math.ceil(kb.widthAbs/16),
							maxNumRows = Math.ceil(kb.heightAbs/(kb.toAbsHeight(c.keyHeight)));
						av.keyboard.log.debug("Will have a panelBlocks array with numCols=" + numCols + " from keyHeight="+c.keyHeight + ", kb.heightAbs="+kb.heightAbs);
						
						var	panelBlocks = new Array(),//A "lookup" array - every 16xN macroblock is kept track of in this 2-D array of the panel grid
							curCol = 0, curRow = 0;//where the next macroblock available is
						
						var panel = {
								id 			: panelId,
								index 		: index,
								blocks 		: null,
								keys  		: [],
								html		: '',
								defaultFocus: av.getProperty(pConfig,'defaultKey',0),//can also be overridden at the key level
								name: av.getProperty(pConfig,'name',''),//t
								currentFocus: '',
								
								shiftKeys : [],//all shift keys must be kept in this array by id so we can operate on multiple shift buttons and caps lock (i.e. make shift "stateful")
								shiftState	: 0,
								shiftStates : av.getProperty(pConfig, 'shiftStates',c.shiftStates),
								ids			: {},//named key->index pairs
								aliases 	: {},//name alias->index pairs
						};
						av.keyboard.log.debug(keys)
						av.keyboard.log.debug(keys.length)
						av.keyboard.log.debug((keys.hasOwnProperty('length')));
						if(!(keys.hasOwnProperty('length'))) throw(new TypeError('av.keyboard.createKeyboard().createPanel('+index+",keys) - expected 2nd argument an array of keys, received " + typeof(keys)));
						//Algorithm - 1. create keys and keep track of who goes where
						//av.keyboard.log.debug("keys are: "); av.keyboard.log.debug(keys); av.keyboard.log.debug(panelBlocks);
						
						generatekeys://label for outter for loop

						for(var i=0; i<keys.length; i++){
							var keyId = 'AVKeyboard'+av.keyboard.numKeyboards+"p"+index+'k'+	i;
							
							prevKeyId = i==0 ? keyId : panel.keys[i-1].id; //in case marginLeft is set, we need to remember our predessor @TODO make this work when used on a key in COLUMN-0
							key = keys[i];
							av.keyboard.log.debug("key: " + key);
							if(typeof(key) == 'string'){
								av.keyboard.log.debug("key: " + key);
								key = {label:key, value:key};
							}
							else if(typeof(key) == 'undefined'){
								av.keyboard.log.error("kb.createPanel("+index+",..) - key with index="+i+" was undefined, please check your syntax in the panel.keys[] array to ensure no elements are empty (i.e. [1,2,3,,,6])");
								continue;
							}
							//av.keyboard.log.debug('on key ' + i + ':' + uneval(key)); 
							if(typeof(key.label) == 'undefined' && typeof(key.value) != 'undefined') key.label = key.value;
							
							
							width = kb.toAbsWidth(av.getProperty(key, 'width',c.keyWidth));
							height = kb.toAbsHeight(av.getProperty(key, 'height',c.keyHeight))
							
							//1st iteration
							if(panelBlocks.length == 0){
								panelBlocks.push(new Array(numCols));//populate the first row with an array of column placeholders
							}
							
							//do we need to insert spacer on the left?
							var marginLeft = kb.toAbsWidth(av.getProperty(key, 'marginLeft',c.keyMarginLeft));
							if(marginLeft > 0){
								//insert the id of our left neighbor on our left so that we know to navLeft over the space without a while() later
								for(var prevCol = curCol; prevCol < (marginLeft/16+curCol); prevCol++){
									panelBlocks[curRow][prevCol] = prevKeyId;
								}
								curCol += (marginLeft/16);
							}
								
							//Do we need to progress to the next row?
							var endPos = (width + curCol*16);
							var endCol = endPos/16;
							checkForSpace://label for inner for loop
							for(var spaceCheckColumn = curCol; spaceCheckColumn < endCol; spaceCheckColumn++){
								if(typeof(panelBlocks[curRow][spaceCheckColumn]) == 'string'){
									av.keyboard.log.debug("generatekeys: collision detected in row " + curRow + " when checking for space from column " + curCol +" at column #" + spaceCheckColumn +", trying next position");
									curCol++, i--;
									continue generatekeys;//retry this key after incrementing the column
									
								}
							}
							
							av.keyboard.log.debug("For key " + key.label +" it ends at " + endPos + "px, where kb.widthAbs="+kb.widthAbs);
							if(endPos > kb.widthAbs){
								curRow++;
								//Are we beyond the number of rows that will fit in this panel? If so, extra keys get thrown out
								if(curRow >= maxNumRows){
									av.keyboard.log.warn("keyboard.createPanel("+index+",...) - the number of keys with the provided dimensions within panel " + index +" exceeds the size of the keyboard, ignorning keys past key #"+i);
									i = keys.length;
									continue;
								}
								curCol = 0;
								
								//Only add a new row if we don't have a row generated from a multi-row key already in curRow
								if(typeof(panelBlocks[curRow]) == 'undefined'){
									panelBlocks.push(Array(numCols));
									av.keyboard.log.debug("Making panelBlocks.length="+(panelBlocks.length))
								}
								
							}
							var row = curRow;
							var left = 16*curCol ;
							var top = curRow*c.keyHeight;
							//insert accross as many spots as this key uses
							for(var b=0; b<(width/16); b++){
								av.keyboard.log.debug("curRow/curCol="+curRow+"/"+curRow)
								//How many rows does this key span?
								var numRowsNeeded = Math.ceil(height/c.keyHeight);
								av.keyboard.log.debug('numRowsNeeded for key='+key.label+' is ' + numRowsNeeded + ', c.keyHeight='+c.keyHeight)
								
								//insert into our grid place holder in each spot vertically that this key will fill
								for(var h=0; h<numRowsNeeded; h++){
									if(panelBlocks.length <= (curRow+h)){
										av.keyboard.log.debug("Making panelBlocks.length="+(panelBlocks.length+1))
										panelBlocks.push(Array(numCols));
									}
									av.keyboard.log.debug('panelBlocks['+(curRow+h)+']['+curCol+'] --> ' + key.label);
									panelBlocks[curRow+h][curCol] = keyId;
								}
								
								curCol++;
							}
							
							//is THIS KEY the default focus for this panel?
							if(av.getProperty(key, 'isDefault',false)) panel.defaultFocus = i;
							var label = av.getProperty(key,'label', key.value);
							var alias = av.getProperty(key,'alias', key.label)
							
							panel.keys[i] = {
									id		: keyId,
									alias 	: alias,//used to allow user a GUID to this key
									
									left	: left,
									top		: top,
									width 	: width,
									height 	: height,
									style	: av.getProperty(key,'style',c.defaultKeyStyle),
									noShift	: av.getProperty(key, 'noShift', false),//is this key subject to "shift"ing or CAPS?
									
									ci : i,//index in the original keys
									
									label	: label,
									value	: key.value,
									
									uses	: av.getProperty(key, 'uses',c.defaultFunction),
							}
							var keyClass = av.getProperty(key, 'keyClass', '');
							if(keyClass != '') panel.keys[i].keyClass = keyClass;//to avoid too much overhead, only insert explicit keyClass values, the rest use default
							
							panel.ids[keyId] = i;//lookup key for looking up key in panel.keys[] based on name instead of looping over all keys
							panel.aliases[alias] = i;
							if(panel.keys[i].uses == 'shift') panel.shiftKeys.push(keyId);
							
						}
						av.keyboard.log.debug("Made a panel with " + panelBlocks.length + " ("+c.keyHeight+" high each) rows and " + numCols + " columns ");//av.keyboard.log.debug("panelBlocks is = "); av.keyboard.log.debug(panelBlocks); av.keyboard.log.debug('panel is:'); av.keyboard.log.debug(panel);
						//Algorithm - 2. use the key layout to determine chase map AHEAD of time, no need to calculate each keypress, pre-determined
						for(var i=0; i<panel.keys.length; i++){
							var key = panel.keys[i];
							var navUpId = navDownId = navRightId = navLeftId = '';
							var colIndex = key.left/16;
							var rowIndex = key.top/c.keyHeight;
							
							//Going Up? if rowIndex === 0 and the keyboard is not circular...
							var navOverride = av.getProperty(keys[key.ci],'navUpAlias','');
							if(navOverride){
								var navIndex = panel.aliases[navOverride];
								navUpId = panel.keys[navIndex].id;
							}else if(rowIndex === 0 && c.navUp !== ''){
								navUpId = av.getProperty(keys[key.ci],'navUp', c.navUp);//default is to chase to yourself
								if(c.navUp === false) navUpId = av.isRendercast ? key.id : '';
							}else{
								var rowUp = rowIndex === 0 ? panelBlocks.length-1 : rowIndex -1;//circular or just up one row
								var colUp = av.getProperty(keys[key.ci],'defaultNavUp',c.defaultNavUp) == -1 ? colIndex : colIndex+(key.width/16 - 1);
								navUpId = panelBlocks[rowUp][colUp];//GOT THE ID
								navUpId = av.getProperty(keys[key.ci],'navUp',navUpId);
								var navUpKey = panel.keys[panel.ids[navUpId]];
							}
							
							//Going Down? if rowIndex === length-1 and the keyboard is not circular...
							av.keyboard.log.debug("For key " + key.label + " should chasing be circular if needed? " + (c.navDown !== ""))
							var navOverride = av.getProperty(keys[key.ci],'navDownAlias','');
							if(navOverride){
								var navIndex = panel.aliases[navOverride];
								navDownId = panel.keys[navIndex].id;
							}else if(rowIndex === (panelBlocks.length-1) && c.navDown !== ''){
								//av.keyboard.log.debug('key ' + uneval(key) + ' is in the bottom row, with rowIndex= '+rowIndex+' and panelBlocks.length= ' + panelBlocks.length + ' and key.height='+key.height );
								//av.keyboard.log.debug(uneval(panelBlocks));
								navDownId = av.getProperty(keys[key.ci],'navDown', c.navDown);//default is to chase to yourself
								if(c.navDown === false) navDownId = av.isRendercast ? key.id : '';
							}else{
								var rowDown = rowIndex === panelBlocks.length-(key.height/c.keyHeight) ? 0 : rowIndex + (key.height/c.keyHeight);//circular or just up down row
								var colDown = av.getProperty(key,'defaultNavDown',c.defaultNavDown) == -1 ? colIndex : colIndex+(key.width/16 - 1);
								av.keyboard.log.debug("For key " + key.label + ' rowdown/coldown=' + rowDown + "/" + colDown)
								navDownId = panelBlocks[rowDown][colDown];//GOT THE ID
								navDownId = av.getProperty(keys[key.ci],'navDown',navDownId);
								//var navDownKey = panel.keys[panel.ids[navDownId]];
							}
							
							//Going Left? if rowIndex === length-1 and the keyboard is not circular...
							var navOverride = av.getProperty(keys[key.ci],'navLeftAlias','');
							if(navOverride){
								var navIndex = panel.aliases[navOverride];
								navLeftId = panel.keys[navIndex].id;
							}else if(colIndex === 0 && c.navLeft !== ''){
								navLeftId = av.getProperty(keys[key.ci],'navLeft', c.navLeft);//default is to chase to yourself
								if(c.navLeft === false) navLeftId = av.isRendercast ? key.id : '';
							}else{
								var rowLeft = av.getProperty(keys[key.ci],'defaultNavLeft',c.defaultNavLeft) == -1 ? rowIndex : (rowIndex + key.height/c.keyHeight - 1);//circular or just up down row
								av.keyboard.log.debug(keys[key.ci].defaultNavLeft + " " + c.defaultNavLeft)
								//av.keyboard.log.debug(c); return;
								av.keyboard.log.debug("rowLeft for key " + key.label + "with rowIndex=" + rowIndex + " is " + av.getProperty(key,'defaultNavLeft',c.defaultNavLeft));
								var colLeft = colIndex === 0 ? numCols -1 : colIndex - 1;
								navLeftId = panelBlocks[rowLeft][colLeft];//GOT THE ID
								navLeftId = av.getProperty(keys[key.ci],'navLeft',navLeftId);
								var navLeftKey = panel.keys[panel.ids[navLeftId]];
							}
							
							//Going Right? if (colIndex+width) >= numCols and the keyboard is not circular...
							//av.keyboard.log.debug("FOUND NAVRIGHT: " + navRightId + " for key " + key.id + " on col " + colIndex + " of " + numCols);
							var nextColumnStart = colIndex + (key.width/16);
							var columnsNextKey = (i+1) < keys.length ? kb.toAbsWidth(av.getProperty(keys[i+1], 'width',c.keyWidth))/16 : 1000;
							var nextColumnEnd = nextColumnStart + columnsNextKey;
							//av.keyboard.log.debug("For key " + key.label + " the nextColumn ends at " + nextColumnEnd + " of " + numCols); 
							var navOverride = av.getProperty(keys[key.ci],'navRightAlias','');
							if(navOverride){
								var navIndex = panel.aliases[navOverride];
								navRightId = panel.keys[navIndex].id;
							}else if(nextColumnEnd > numCols && c.navRight !== ''){
								//av.keyboard.log.debug("No navRight");
								navRightId = av.getProperty(keys[key.ci],'navRight', c.navRight);//default is to chase to yourself
								if(c.navRight === false) navRightId = av.isRendercast ? key.id : '';
								
							}else{
								//av.keyboard.log.debug("Find navRight");
								var rowRight = av.getProperty(keys[key.ci],'defaultNavRight',c.defaultNavRight) == -1 ? rowIndex : (rowIndex + key.height/c.keyHeight - 1);//circular or just up down row
								var colRight = nextColumnEnd > numCols ? 0 : colIndex + (key.width/16);
								if(i<(panel.keys.length-1) && av.getProperty(keys[panel.keys[i+1].ci],'marginLeft',0) > 0){//@TODO this restriction forces key #1 in any row NOT to be allowed to have marginLeft
									navRightId = panel.keys[i+1].id;//dump lookup to the right of me so long as I'm not followed by a 0th-column marginLeft element
								}else{
									navRightId = panelBlocks[rowRight][colRight];//GOT THE ID
								}
								navRightId = av.getProperty(keys[key.ci],'navRight',navRightId);
								var navRightKey = panel.keys[panel.ids[navRightId]];
							}
							
							av.keyboard.log.debug("For key " + key.label + " navUp is row/col = " + rowUp + "/"+colUp + "(label="+av.getProperty(navUpKey,'label','')+')')
							
							//styling
							var className = kb.getKeyClass(key, false);
							//var styleName = kb.getKeyStyle(key, keys);
							//workaround to all retrieving the nav property of an element, not available in hilversum via the style object
							//if(av.isRendercast){
								panel.keys[i].navUp = navUpId;
								panel.keys[i].navRight = navRightId;
								panel.keys[i].navDown = navDownId;
								panel.keys[i].navLeft = navLeftId;
							//}
								
							panel.html += '<' + c.keyTag +' id="'
											+key.id+'" class="'
											+ className + '" style="width:'
											+key.width+'px; height:' +
											+key.height+'px; left:'
											+key.left+'px; top:'
											+key.top+'px; nav-up:'
											+navUpId+'; nav-right:'
											+navRightId+'; nav-down:'
											+navDownId+'; nav-left:'
											+navLeftId+'; ' + 
											panel.keys[i].style + '">' //arbitrary styles go here
											+av.string.htmlEntities(key.label)+'</' + c.keyTag +'>';//@TODO add className, etc
						}
						
						av.keyboard.log.debug(panel);
						return panel;
					}
					
					
					kb.getKeyClass = function(key, focused){
						focused = typeof(focused) == 'boolean' ? focused : false;
						var className = 'AVB AVB' + key.width + 'x' + key.height + (kb.fakeFocus && focused ? '_f' : '');//append _f if we are not using real focus
						
						//when not foucsed
						if(!focused) className += ' AVB' + av.getProperty(key,'keyClass',c.keyClass)+key.width+'x'+key.height + ' ' + av.getProperty(key,'keyClass',c.keyClass);
						
						av.keyboard.log.debug("getKeyClass("+key.id+","+focused+") ---> " + className);
						av.keyboard.log.debug(key);
						//previousKey
						return className;
					}
					
					kb.notifyKeyDown = function(evt){
						var keyId = evt.target.id;
						var keyIdentifier = av.getKeyIdentifier(evt);
						var isNav = !keyIdentifier ? false : ("Up,Down,Left,Right").indexOf(keyIdentifier) != -1;
						
						if(keyIdentifier == 'Enter'){
							kb.handleEvent.apply(kb,['click', evt]);//pass the click event through	
							if(evt.stopPropagation){evt.stopPropagation();}
							if(evt.preventDefault){evt.preventDefault();}	
						}else if(!isNav){return;}
						
						//if the last key is in the same direction they are now headed, choose it over the default decision
						//In the direction I am headed, does the last key point to me?
						var invertedChaser = 'nav'+av.keyboard.opposites[keyIdentifier];
						if(c.useBreadcrumbChaser && kb.lastKey && kb.lastKey[invertedChaser] == keyId){
							evt.stopPropagation();
							evt.preventDefault();
							av.dom.focus(kb.lastKey.id); 
						}else if(!av.dom.getNav(evt.target, keyIdentifier)){
							//DO NOT update the lastKey, we already have it in our buffer, and if not chasing, should remain in buffer
							return;
						}
						
						kb.lastKey = kb.getKeyById(evt.target.id);
						//print('last key: ' + uneval(kb.lastKey));
						
						
						//evt.data = kb.getKeyById(evt.target.id);
						//kb.dispatchEvent('changekey', evt)
						
					}
					
					kb.notifyChangeKey = function(evt){
						
						if(c.useBreadcrumbChaser){// && kb.lastKey){
							av.keyboard.log.debug('keyup evt source: ' + evt.target.id);
						}
						
						
						//print('keyup ' + kb.id);
						//print(uneval(kb.eventListeners.changekey));
						
						var keyId = evt.target.id;
						var keyIdentifier = av.getKeyIdentifier(evt);
						//var isNav = !keyIdentifier ? false : ("Up,Down,Left,Right").indexOf(keyIdentifier) != -1;
						//if(!isNav){return;}
						
						evt.data = kb.getKeyById(evt.target.id);
						kb.dispatchEvent('changekey', evt)
					}
					
					kb.handleEvent = function(type, evt){
						var keyIdentifier = av.getKeyIdentifier(evt);
						av.keyboard.log.debug("Received event of type " + type + " on target " + evt.target.id);
						var keyIndex = kb.panels[kb.curPanel].ids[evt.target.id];
						var key = kb.panels[kb.curPanel].keys[  keyIndex  ];
						av.keyboard.log.debug("Key with index="+keyIndex+" is " + uneval(kb.panels[kb.curPanel].keys[  keyIndex  ]))
						
						if(type == 'click'){
							//get function tied to this key
							var uses = kb.functions[key.uses];
							av.keyboard.log.debug("click uses " + typeof(uses) + " and key.value="+key.value);
							if(typeof(uses) == 'function'){
								evt.data = key.value;
								
								//set up a timer to clear the selected state
								var s = ' AVB'+key.width+'x'+key.height+'_s';
								
								var stopEvent = kb.functions[key.uses].apply(kb, [evt]);
								
								//NOTE - the below DOES NOT work on hilversum because className CSS does not cascade
								//and pseudo focus is not preserved upon resetting className, so if element X is focused,
								//changing the class loses the background image defined in #X:focus{}
								if(c.useSelectedStates && evt.target.className.indexOf(s) == -1){
									var clearFocus = (function(classAdded, elem){return function(){
										var newClass = elem.className.replace(classAdded, '');
										//av.keyboard.log.debug("Resetting style on " + elem.id + " to: " + newClass);
										//av.keyboard.log.debug("Window current focus on: " + av.doc.activeElement.id)
										elem.className = newClass;
									};})(s, evt.target)
									//av.keyboard.log.debug("Setting style on " + evt.target.id + " to: " + evt.target.className + s);
									evt.className += s;
									setTimeout(clearFocus,c.clickTime);
								}
								
								
								
							}else{
								av.keyboard.log.warn("kb.handleEvent(click,{}) - no funciton in configuration defined called '" + key.uses+ "'. Available functions are: " + av.arrayKeys(kb.functions).join(', '));
							}
						}else{
							av.keyboard.log.debug("keyIdentifier=" + keyIdentifier);
							av.keyboard.log.debug(key);
						}
						
					}
					
			//BEGIN FAKE FOCUS CODE		
					/**
					 * Whenever we are not using real focus, we must listen on the target or another element in the DOM, and 
					 * navigate the keyboard visually so that it appears we are chasing around the keyboard, and editing text
					 */
					kb.interceptKeyEvents = function(evt){
						if(!kb.fakeFocus) return;
						
						var keyIdentifier = av.getKeyIdentifier(evt);
						if(("Right,Left,Up,Down,").indexOf(keyIdentifier+',') != -1){
							av.keyboard.log.debug("Moving keyboard focus: " + keyIdentifier);
							kb.moveFocus(keyIdentifier);
							
							//Kill the event, do not allow real chasing and clicking
							evt.stopPropagation();
							evt.preventDefault();
						
						}
						
					
					}
					
					
					kb.interceptKeyClicks = function(evt){
						if(!kb.fakeFocus) return;
						
						//dispatch whatever function this key uses
						var key = kb.getKeyById(kb.panels[kb.curPanel].currentFocus);
						var syntheticEvent = av.dom.cloneEvent(evt);
						var elem = av.dom.get(key.id);
						av.keyboard.log.debug("CLONED EVENT ------------- " );
						av.keyboard.log.debug(syntheticEvent);
						syntheticEvent.target = elem;
						syntheticEvent.currentTarget = elem;
						
						//dispatch a click
						kb.handleEvent.apply(kb,['click', syntheticEvent]);
						
						//Kill the event, do not allow real chasing and clicking
						evt.stopPropagation();
						evt.preventDefault();
						
					}
					
					/**
					 * When the keyboard is focused, we need to send the focus back to the 
					 */
					kb.interceptFocusEvents = function(evt){
						//elem may be defined since we are added in the context of the subribeToElement... let's see
						
						av.keyboard.log.debug("interceptFocusEvents: " + kb.objectToIntercept);//we need to know where to put focus, should focus kb.objectToIntercept
						av.dom.focus(kb.objectToIntercept);
						kb.focus();//reset the fake focus
					}
					
					/**
					 * Begin handling clicks and keydown events on elem as if they were being sent to the keyboard
					 */
					kb.subscribeToElement = function(elem){
						
						if(!c.fakeFocus){
							av.keyboard.log.warn("subscribeToElement("+elem+") - cannot subscribeToElement when config property 'config.fakeFocus' is false. First enable fakeFocus");
							return false;
						}
						
						kb.unsubscribeFromElement(elem);//don't want to double up on event listeners! Only allowed to listen for keypresses on 
						//a single object at a time
						
						kb.objectToIntercept = elem;
						var obj = av.dom.get(elem);
						av.keyboard.log.debug("Adding click and keydown event listeners to " + obj.id + " and re-routing them to the keyboard.")
						obj.addEventListener('click',kb.interceptKeyClicks, true);
						obj.addEventListener('keydown',kb.interceptKeyEvents, true);
						if(kb.dom !== null) kb.dom.addEventListener('focus',kb.interceptFocusEvents, true);
						
						return true;
					}
					
					/**
					 * Stop handling clicks and keydown events on elem as if they were being sent to the keyboard
					 */
					kb.unsubscribeFromElement = function(elem){
						kb.objectToIntercept = null;
						
						var obj = av.dom.get(elem);
						av.keyboard.log.debug("Removing click and keydown event listeners from " + obj.id + " that were being re-routed to the keyboard.")
						obj.removeEventListener('click',kb.interceptKeyClicks, true);
						obj.removeEventListener('keydown',kb.interceptKeyEvents, true);
						
						if(kb.dom !== null) kb.dom.removeEventListener('focus',kb.interceptFocusEvents, true);
					}
					
					/**
					 * Move the focus of the current chaser in the direction given, if there is a chaser defined in that direciton
					 */
					kb.moveFocus = function(direction){
						if(("Right,Left,Up,Down,").indexOf(direction+',') == -1){
							av.keyboard.log.warn("kb.moveFocus("+direction+") - expects arguments to be either Up, Down, Left or Right (case sensitive).");
						}
						var chaser = 'nav'+direction;
						av.keyboard.log.debug("Moving keyboard focus: " + direction + " and chaser css property= " + chaser);
						var key = kb.getKeyById(kb.panels[kb.curPanel].currentFocus);
						var keyDOM = av.dom.get(key.id);
						
						
						
						var navId = av.isRendercast ? key['nav'+direction] : av.getProperty(keyDOM.style, 'nav'+direction, '');
						av.keyboard.log.debug("Current key: " + key.id + ", with DOM styles.nav"+direction+": " + navId);
						
						
						if(navId == ''){
							av.keyboard.log.debug("kb.moveFocus("+direction+") - no chaser in that direction, no change to focus");
							return;
						}else{
							//av.keyboard.log.debug("Moving focus to " + nextKeyId);
							var nextKey = kb.getKeyById(navId);
							
							//is the navId defined but nextKey is undefined? Then chase to the element with that ID, outside of keyboard
							if(!nextKey){
								kb.blurKey(key);
								av.keyboard.log.debug("Moving focus outside of keyboard to: " + navId);
								av.dom.focus(navId);
							}else{
								//av.keyboard.log.debug("Moving focus to element " + nextKey);
								kb.focusKey(nextKey);
							}
							
						}
						
						
					}
					
					/**
					 * Shorthand for kb.moveFocus('Down');
					 */
					kb.moveFocusDown = function(){
						kb.moveFocus('Down');
					}
					
					/**
					 * Shorthand for kb.moveFocus('Up');
					 */
					kb.moveFocusUp = function(){
						kb.moveFocus('Up');
					}
					
					/**
					 * Shorthand for kb.moveFocus('Left');
					 */
					kb.moveFocusLeft = function(){
						kb.moveFocus('Left');
					}
					
					/**
					 * Shorthand for kb.moveFocus('Right');
					 */
					kb.moveFocusRight = function(){
						kb.moveFocus('Right');
					}
					
		//END FAKE FOCUS CODE
					
					
					kb.getKeyById = function(keyId){
						var panel 	= kb.panels[kb.curPanel];//pointer by reference 
						var keyIndex= panel.ids[keyId];
						return panel.keys[keyIndex];
						
					}
					
					kb.getKeyByAlias = function(keyAlias){
						var panel 	= kb.panels[kb.curPanel];//pointer by reference 
						var keyIndex= panel.aliases[keyAlias];
						if(isNaN(keyIndex)){return false;}
						return panel.keys[keyIndex];
						
					}
					
					kb.focusKey = function(key){
						var panel = kb.panels[kb.curPanel];//pointer by reference
						if(kb.fakeFocus){ 
							//unfocus previouslly focused button on this panel, if any
							if(kb.panels[kb.curPanel].currentFocus != ''){
								var previousKeyIndex = panel.ids[panel.currentFocus]
								var previousKey = kb.panels[kb.curPanel].keys[previousKeyIndex];
								av.keyboard.log.debug("Faking blur of " + kb.panels[kb.curPanel].currentFocus);
								kb.blurKey(previousKey);
							}
							//focus the now focused key 
							av.keyboard.log.debug("Faking focus of " + key.id);
							av.dom.get(key.id).className = kb.getKeyClass(key, true);
						}else{
							av.dom.focus(key.id);
						}
						
						panel.currentFocus = key.id;
					}
					
					kb.blurKey = function(key){
						var blurClass = kb.getKeyClass(key, false);
						av.keyboard.log.debug("kb.blurKey("+key.id+") - new className = " + blurClass);
						av.dom.get(key.id).className = blurClass;
					}
					
					kb.focus = function(refocus){
						var refocus = typeof(refocus) == 'boolean' ? refocus : false;
						if(refocus && (kb.dom === null || kb.lastKey === null)){
							throw new TypeError("Keyboard.refocus() - kb.dom is null, cannot call refocus() on a non-instantiated keyboard. Call either Keyboard.focus() or Keyboard.show() first.");
						}
						
						if(kb.dom === null){
							kb.show();
						}
						
						
						if(refocus){
							av.keyboard.log.debug("Focusing " + kb.lastKey.id);
							kb.focusKey(kb.lastKey);
							
							var evt = {data : kb.lastKey, target : av.dom.get(kb.lastKey.id)};
							kb.dispatchEvent('changekey', evt)
						}else{
							var key = kb.panels[kb.curPanel].keys[kb.panels[kb.curPanel].defaultFocus];
							av.keyboard.log.debug("Focusing " + key.id);
							kb.focusKey(key);	
						}
						
					}
					
					kb.createDOM = function(){
						
						av.keyboard.log.debug("kb.createDOM()")
						av.keyboard.log.debug(uneval(c));
						//1. Create a hidden node in the DOM
						var contWidth = (c.width+c.padding*2), contHeight = (c.height + c.padding*2);
						var dummyStyles = {width:contWidth+'px', height:contHeight+'px'};
						av.keyboard.log.debug(dummyStyles);
						var dummyHolder = av.dom.create('div','dummyNode','',dummyStyles);
						av.keyboard.log.debug("kb.createDOM()1")
						av.dom.hide(dummyHolder);
						av.keyboard.log.debug("kb.createDOM() 2")
						av.doc.body.appendChild(dummyHolder);
						av.keyboard.log.debug("kb.createDOM() 3")
						
						//2. Build up the keyboard and each panel
						
						av.keyboard.numKeyboards++;
						var keyboardId = 'AVKeyboard'+av.keyboard.numKeyboards,//id for the keyboard in the DOM, dependent on index of this keyboard 
							s = av.dom.addSuffix,//shorthand to add the HD/SD suffix to a class
							khtml = '<div id="'+keyboardId+'" class="AVKeyboard ' + s('AVKeyboard') + ' ' +c.keyboardClass + ' ' + (av.isRendercast ? 'AVKeyboardRendercast' : 'AVKeyboardStitcher') + '"'
									+ ' style="width:' + contWidth +'px; height:'+contHeight+'px;">';
						av.keyboard.log.debug("PANELS ------------------");
						
						var padding = kb.toAbsWidth(c.padding), panelWidth = k.widthAbs, panelHeight = k.heightAbs;
						//Now turn the keyboards
						for(var i=0; i<panels.length; i++){
							av.keyboard.log.debug(uneval(panels[i]));
							kb.panels[i] = kb.createPanel(i, panels[i]);
							//av.keyboard.log.debug("Panel " + i + " html: " + kb.panels[i].html)
							//@TODO - need to build up each panel as a seperate set of HTML strings and/or dom nodes
							//that minimize memory, currently planning for DIV
							khtml +=  '<div id="' + kb.panels[i].id + '" class="AVKeyboardPanel" ' 
									+ 'style="visibility:hidden; left:'+padding+'px; top:'+padding+'px; width:'+panelWidth+'px; height:'+panelHeight+'px;">'
									+ kb.panels[i].html
									+ '</div>';
						}
						av.keyboard.log.debug("END PANELS ------------------");
						khtml += '</div>';
						
						//av.dom.get(c.holder).innerHTML = khtml;
						//return;
						
						/*
						var x = new XMLHttpRequest();
						var url = 'http://p.amgapps.com:8080/rpc/rest/data/saveObject';
						var data = 'pairing_token=6249959e7794fd9da7d19676dfaea61caab79564&key=xml&data='+encodeURIComponent(khtml);
						x.open('POST',url,false);
						x.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
						x.send(data);
						av.keyboard.log.debug("Response: " + x.responseText);*/
						
						//3. Insert the Keyboard HTML into dummyHolder DIV
						khtml = khtml.split("<button").join("\n\t<button").split("<div").join("\n<div")
						av.keyboard.log.debug("innerHTML: " + khtml);
						dummyHolder.innerHTML = khtml;
						//av.keyboard.log.debug("Keyboard HTML: " + dummyHolder.childNodes.item(1).id);
						
						
						//4. Attach event listeners to keyboard
						var kDOM = av.dom.get(keyboardId);//, kDOM = elem.parentNode.removeChild(elem);
						
						
						//av.keyboard.log.debug("Event types: " + c.eventTypes.length)
						//av.keyboard.log.debug(c.eventTypes);
						for(var i=0; i<c.eventTypes.length; i++){
							av.keyboard.log.debug("attaching " + listener + "  to event " + c.eventTypes[i]);
							var eventType = c.eventTypes[i].toString();
							var listener = function(eventTypeLocal){
								return function(evt){
									kb.handleEvent.apply(kb,[eventTypeLocal, evt]);
								};
							}(eventType.toString())
							
							kDOM.addEventListener(c.eventTypes[i], listener, true);	
						}
						
						
						kDOM.addEventListener('focus', kb.notifyChangeKey, true);
						kDOM.addEventListener('keydown', kb.notifyKeyDown, true);
						
						//5. Remove the keybaord from the dummy node
						kb.dom = dummyHolder.removeChild(kDOM);
						av.keyboard.log.debug("Attached keyboard to DOM: " + kDOM);
						
						//Don't attach the DOM to the holder until the very last step
						if(typeof(c.holder) != 'undefined'){
							av.keyboard.log.debug("Attaching keyboard to holder: " + c.holder);
							kb.setHolder(c.holder);
						}else{
							av.keyboard.log.debug("av.keyboard.createDom() - no holder found in DOM");
						}
					}
					
					kb.show = function(){
						av.keyboard.log.debug("kb.show()");
						kb.reset();
						
						if(kb.dom === null){
							av.keyboard.log.debug('keyboard DOM needs creation');
							kb.createDOM();
						}else{
							av.keyboard.log.debug('keyboard DOM already created');
						}
						
						//Hide current panel if it is 
						var curPanelId = kb.panels[kb.curPanel].id;
						//
						av.keyboard.log.debug("kb.show() - showing panel " + curPanelId);
						av.dom.show(curPanelId);
					}
					
					kb.hide = function(){
						if(kb.dom !== null){
							var curPanelId = kb.panels[kb.curPanel].id;
							av.dom.hide(curPanelId);
							kb.reset();
							
							av.keyboard.log.debug("kb.hide() - hid panel with id="+curPanelId+" and reset to " + kb.panels[kb.curPanel].id);
						}
						
					}
					/**
					 * Get the current value held by any textarea or input as defined or in DOM, not via scripted keyboard. Looks only in "value" and "innerHTML"
					 */
					kb.getTargetValue = function(){
						if(!kb.hasTarget()){
							throw new TypeError('keyboard.getTargetValue() - cannot setText because no target has been set. Call kb.setTarget(domElementOrId) first.');
						}
						var val = av.getProperty(kb.target, 'value', kb.target.innerHTML);
						av.keyboard.log.debug("Value: " + val);
						return val;
					}
					
					kb.getTarget = function(){
						return kb.target;
					}
					
					kb.setTarget = function(target, resetValue){
						var newTarget = av.dom.get(target);
						kb.removeTarget();
						
						resetValue = typeof(resetValue) == 'boolean' ? resetValue : false;
						if(newTarget){
							kb.target = newTarget;

							
							//@TODO if this gets too complex, move this into a function like kb.setupTarget() for first call on textarea/input
							//set the current textvalue on the new target, using previous value from ITSELF if one exists, or defined value
							if(resetValue){
								kb.target.textvalue = '';
							}else{
								kb.target.textvalue = av.getProperty(kb.target, 'textvalue', kb.getTargetValue())
							}
							kb.target.persistentCursor = false;//we do cursors ourselves
							kb.target.cursorPosition = kb.target.textvalue.length;

							av.keyboard.log.debug("setTarget() - cursorPostion = " + kb.target.cursorPosition)
							av.keyboard.log.debug("keyboard.setTarget() - set target to " + av.getProperty(kb.target,'id',kb.target));
							
							kb.updateTextDisplay(false, false);
							
							return true;
						}else{
							return false;
						}
					}
					
					kb.removeTarget = function(){
						//remove cursor from previous text field, and normalize the value
						if(kb.target !== null){
							kb.updateTextDisplay(false, true);
						}
						kb.target = null;//removes pointer to the target						
					}
						
					
					kb.setHolder = function(holder){
						kb.removeHolder();
						
						kb.holder = av.dom.get(holder);
						kb.holder.appendChild(kb.dom);
					}
					
					kb.removeHolder = function(){
						if(!kb.hasHolder()) return false;
						
						kb.holder.removeChild(kb.dom);//remove ourselves from the DOM
						kb.holder = null;
						
						return true;
					}
					
					kb.getValue = function(){
						//av.keyboard.log.debug('kb.getValue() ... kb.textvalue -- ' + kb.target.textvalue + ' OR ' + kb.target.getAttribute('textvalue'));
						
						return av.getProperty(kb.target, 'textvalue', '');
					}
					
					kb.getInputType = function(){
						return av.getProperty(kb.target, 'type', '');
					}
					
					
					
					
					
					/**
					 * Event registration on the keyboard is done on the keyboard level, not per key, and we internally track registered functions
					 * as they need to be reset when moving from 1 text field to another at times if user has registered their own
					 * callbacks through this interface. Examples could be onblur they change the type back to password, but onfocus it becomes a plain text field
					 */
					kb.eventListeners = {};
					kb.removeAllEventListeners = function(){
						//1. Remove DOM listeners 
						for(var type in kb.eventListeners[type])
							for(var i=0; i<kb.eventListeners[type].length; i++)
								kb.dom.removeEventListener(type,kb.eventListeners[type][i].func, kb.eventListeners[type][i].bubbles, true);
						//2. Remove INTERNAL listeners
						kb.eventListeners = {};//clear out all function references in our internal structure
					}
					
					kb.addEventListener = function(onType, func, bubbles){
						bubbles = typeof(bubbles) == 'boolean' ? bubbles : true;
						
						if(!(kb.eventListeners[onType] instanceof Array)) kb.eventListeners[onType] = [];
						
						kb.eventListeners[onType].push({'func':func,'bubbles':bubbles})//bubbles is NOT A JOKE, it means does the event bubble
						
						//kb.dom.addEventListener(onType, func, bubbles);
					}
					
					kb.removeEventListener = function(onType, func, bubbles, preserveFunction){
						bubbles = typeof(bubbles) == 'boolean' ? bubbles : true;
						preserveFunction = typeof(preserveFunction) == 'boolean' ? preserveFunction : false;
						
						kb.dom.removeEventListener(onType, func, bubbles);
						
						//remove internal reference
						if(!(kb.eventListeners[onType] instanceof Array)) return false;
						if(preserveFunction) return true;
						
						for(var i=0; i<kb.eventListeners[onType].length; i++){
							if(kb.eventListeners[onType][i].func == func){
								av.keyboard.log.debug("Removed event listener on keyboard for " + onType + " of " + kb.eventListeners[onType].length + " total");
								kb.eventListeners[onType].splice(i,1);
								return true;
							}else{
								av.keyboard.log.debug("Could not remove event listener on keyboard for " + onType);
							}
						}
						return true;
					}
					
					kb.dispatchEvent = function(type, evt){
						if(typeof(kb.eventListeners[type]) != 'undefined'){
							av.keyboard.log.debug("kb.dispatchEvent("+type+",...) to " + kb.eventListeners[type].length + " listeners");
							for(var i=0; i<kb.eventListeners[type].length; i++){
								var listener = kb.eventListeners[type][i];
								if(listener.func.apply(kb,[evt]) === false && listener.bubbles) return false;
							}
						}
						return true;
					}
					
					return kb;
				}
				
				var k = (new keyboard()).init();
				
				return k;
			},
			
			/**
			 * ids can be a nodelist, array, or an array of ids of elements which you want keyboard functionality attached to - leave empty
			 * to attach to all textarea elements
			 * 
			 * listenFor is a string for the event you want a keyboard attached to these elements
			 * 
			 * to subscribe to the "text" event, simply av.dom.get('someId').addEventListener('text',someListenerFunction,true) subscribe to the "text" event
			 */
			subscribe : function(listenFor, ids){
				var elements = av.keyboard.toArray(ids);//an array of element ids or nodes or mix
				
				if(typeof(listenFor) != 'string' || !listenFor) listenFor = 'click'
				
				for(var i=0; i<elements.length; i++){
					var elem = av.dom.get(elements[i]);
					elem.addEventListener(listenFor, av.keyboard.showKeyboard, true);
				}
			},
	
			unsubscribe : function(stopListeningFor, ids){
				var elements = av.keyboard.toArray(ids);
				
				if(typeof(stopListeningFor) != 'string' || !stopListeningFor) stopListeningFor = 'click'
				
				for(var i=0; i<elements.length; i++){
					var elem = av.dom.get(elements[i]);
					elem.removeEventListener(stopListeningFor, av.keyboard.showKeyboard, true);
				}
			},
			
			showKeyboard : function(evtOrId, targetForText){
				var elem = typeof(evtOrId) == 'string' ? av.dom.get(evtOrId) : evtOrId.target;
				var type = elem.getAttribute('type');
				
				av.keyboard.log.debug("Keyboard: " + av.keyboard);
				
				var keyboard = av.keyboard.create();
				
				av.keyboard.log.debug("Would have shown keyboard:");
				av.keyboard.log.debug(keyboard.dom);
				
				return keyboard;
			},
			
			/**
			 * Collect the id/value pairs for each element identified by ids (or textarea tags if ids is blank)
			 * @return Object id/value pairs of all values, where password fields contain the unmasked version of the password
			 */
			getTextValues : function(ids){
				var elements = av.keyboard.toArray(ids);
				var values = {};
				for(var i=0; i < elements.length; i++){
					var elem = elements[i];
					var type = elem.getAttribute('type');
						if(typeof(type) != 'string') type = 'text';
					var val = type=='password' ? elem.passwordValue : elem.value;//we update value at the same time we update textarea innerHTML for forward support of input tags
					values[elem.getAttribute('id')] = val;
				}
				return values;
			},
			
			toArray : function(ids){
				if(ids === undefined) ids = av.dom.getTags('textarea');
				else if(ids instanceof String) ids = [ids];//normalize as an array for singleton string argument
				else if(typeof(ids.item) == 'function'){
					var idArray = [];
					for(var i=0; i<ids.length; i++) idArray.push(ids.item(i));
					return idArray;
				}
				
				return ids;
			},
			/**
			 * 
			 */
			keyboard : {},
			
			log 	: new av.Log(av.getEffectiveLogLevel('keyboard'),'av.keyboard'),
			
	}//end avkeyboard
})(av);