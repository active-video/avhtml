/**
 * @fileoverview Defines a timeout interface
 */
if(!av.exists('av.Timeout')){

(function(av){
	/**
	 * @namespace Provides an interface for a configurable timeout screen. 
	 * 
	 */
	av.Timeout = function(){
		/**
		 * @fileoverview Defines a timeout interface
		 */
		//	Application Initialization Variables		
		var timeout_time_of_last_key_pressed = +new Date(); // current time in ms
		var timeout_check_function; //The id of the setInterval Function
		var timeout_overlay; //The div containing the timeout information
		var timeout_text; //The div contining the text relaying the about of time left before the window close.		
		var	timeout_headerText; //The div containing the header information in the text box.
		var	timeout_bodyText; //The div containing the body information in the text box.
		var	timeout_secondsText; //The div containing the seconds information in the text box.
		var userDefinedParameters = arguments[0];
		var defaultAppTimeoutWarning = 1000 * 60 * 4.5; // Set the default time before showing the logout message
		var defaultAppTimeoutLogout = 1000 * 60 * .5; // Set the default time before exiting the session
		var activeElement; //Used to save the focusElement		
		
		//Set the default parameters for the screen overlay
		var defaultStyleObject_overlay = {
			"z-index" : "100000",
			"display" : "none",
			"width" : "100%",		
			"height" : "100%",				
			"backgroundColor" : "rgba(0, 0, 0, 0.8)",				
			"color" : "white",				
			"position" : "absolute",				
			"top" : "0px",				
			"left" : "0px",	
		};
		
		//Set the default parameters for the timeout textbox
		var defaultStyleObject_timeoutText = {
			"display" : "block",
			"width" : "640px",		
			"height" : "360px",				
			"backgroundColor" : "#141414",
			"text-align" : "left",
			"font-size" : "30pt",				
			"color" : "white",
			"padding" : "22px",						
			"margin" : "0px auto",
			"margin-top" : "160px",	
			"border-radius" : "10px",
			"border-style" : "solid",
			"border-width" : "3px",
			"border-color" : "#6e7272",
			"overflow" : "hidden",
		};
		
		var defaultStyleObject_timeoutHeaderText = {
			"text-align" : "left",
			"font-size" : "26pt",	
			"font-weight" : "bold",				
			"color" : "#586463",
			"backgroundColor" : "transparent",
		};
		
		var defaultStyleObject_timeoutBodyText = {
			"display": "inline",
			"padding-top" : "0",				
			"text-align" : "left",
			"font-size" : "16pt",
			"font-weight" : "bold",								
			"color" : "#bbcecc",						
			"line-height" : "2.5",
			"backgroundColor" : "transparent",
		};
		
		var defaultStyleObject_timeoutSecondCounterText = {
			"display": "inline",
			"position" : "relative",
			"text-align" : "left",
			"font-size" : "26pt",
			"font-weight" : "bold",								
			"color" : "#ff7e00",							
			"margin-left" : "4px",	
			"backgroundColor" : "transparent",		
		};
		
		//Updates the timeout object with user-specified arguments.
		loadUniqueArguments = function(){
			if((userDefinedParameters["timeout"])){		
				if(userDefinedParameters["timeout"]["appTimeoutWarning"]){window.config.app.appTimeoutWarning = userDefinedParameters["timeout"]["appTimeoutWarning"];} // Set the default ttime before showing the logout message
				if(userDefinedParameters["timeout"]["appTimeoutLogout"]){window.config.app.appTimeoutLogout = userDefinedParameters["timeout"]["appTimeoutLogout"];} // The amount of time (in ms) to show the warning message
			}
			if((userDefinedParameters["screenOverlay"])){		
				for (var property in userDefinedParameters["screenOverlay"]){
	    			defaultStyleObject_overlay[property] = userDefinedParameters["screenOverlay"][property];
				}	
			}
			if((userDefinedParameters["textOverlay"])){		
				for (var property in userDefinedParameters["textOverlay"]){
	    			defaultStyleObject_timeoutText[property] = userDefinedParameters["textOverlay"][property];
				}	
			}
			if((userDefinedParameters["textOverlay_header"])){		
				for (var property in userDefinedParameters["textOverlay_header"]){
	    			defaultStyleObject_timeoutHeaderText[property] = userDefinedParameters["textOverlay_header"][property];
				}	
			}
			if((userDefinedParameters["textOverlay_body"])){		
				for (var property in userDefinedParameters["textOverlay_body"]){
	    			defaultStyleObject_timeoutBodyText[property] = userDefinedParameters["textOverlay_body"][property];
				}	
			}
			if((userDefinedParameters["textOverlay_secondCounter"])){		
				for (var property in userDefinedParameters["textOverlay_secondCounter"]){
	    			defaultStyleObject_timeoutSecondCounterText[property] = userDefinedParameters["textOverlay_secondCounter"][property];
				}	
			}
		}; 		
		
		//The event listener for keypresses.
		//Updates the most recent keypress
		window.addEventListener("keydown",function(event){
			timeout_time_of_last_key_pressed = +new Date();
			if(timeout_overlay){
				if(timeout_overlay.style.display == "block"){
					hideOverlay();
				}
			}
		}, true);

		/**
		 * Starts the countdown interval, ie. the check to determine 
		 * @return {String} s The id of the running setInterval
		 */
		getNewCountDownInterval = function(){
			return setInterval(function() {		
		        var countdown = window.config.app.appTimeoutWarning - (+new Date() - timeout_time_of_last_key_pressed);
		        if ((countdown + window.config.app.appTimeoutLogout) <= 0){ 
		        	window.close();        	
					av.tracker.track('event', {subject: "timeout"});
					av.tracker.track("app-stop");
		        }        
		        else if (countdown <= 0){
		        	//If the overlayobject exists and should be displayed, display it (but only during the first call)!
		        	if(timeout_overlay && timeout_overlay.style.display == "none"){
		        		timeout_overlay.style.display = "block";
		        		if(document.activeElement != null){
							activeElement = document.activeElement;
							document.activeElement.blur();
						}
		        	}
		        	//If the timeoutText exists, update it with a new time before exit.
		        	if(timeout_text){
		        		timeout_secondsText.innerHTML = parseInt((countdown + window.config.app.appTimeoutLogout) / 1000) + " seconds";
		        	}
		        }
		    }, 500);
		}

		/**
		 * Builds the overlay scrren components that will appear above the current application when the timeout warning occurs. 
		 */
		createOverlays = function(){
			//Create the div objects
			timeout_overlay = buildDiv("timeout_overlay", defaultStyleObject_overlay);
			timeout_text = buildDiv("timeout_textDiv", defaultStyleObject_timeoutText);
			timeout_headerText = buildDiv("timeout_headerTextDiv", defaultStyleObject_timeoutHeaderText,"Timeout");
			timeout_bodyText = buildDiv("timeout_bodyTextDiv", defaultStyleObject_timeoutBodyText,"<br>Your session will end in: ");
			timeout_secondsText = buildDiv("timeout_secondsText", defaultStyleObject_timeoutSecondCounterText);
			timeout_okayText = buildDiv("timeout_okayText", defaultStyleObject_timeoutBodyText, "<br>Press OK/SELECT to cancel.");
			
			//Organize the heirarchy
			timeout_text.appendChild(timeout_headerText);	
			timeout_text.appendChild(timeout_bodyText);	
			timeout_text.appendChild(timeout_secondsText);	
			timeout_text.appendChild(timeout_okayText);
			timeout_overlay.appendChild(timeout_text);	
			document.getElementsByTagName('body')[0].appendChild(timeout_overlay);
			
			//Store a pointer to the objects in local memory
			timeout_headerText = document.getElementById("timeout_headerTextDiv");
			timeout_bodyText = document.getElementById("timeout_bodyTextDiv");
			timeout_overlay = document.getElementById("timeout_overlay");
			timeout_text = document.getElementById("timeout_textDiv");
		}

		/**
		 * Dynamic structure to build divs. 
		 */
		buildDiv = function(divID,propertyArray,_innerHTML){
			//Generate the inner div			
			var _divName = document.createElement("div");
						
			for (var property in propertyArray){
    			_divName.style[property] = propertyArray[property];
			}			
			_divName.id = divID;
			if(_innerHTML){
				_divName.innerHTML = _innerHTML;
			}	
			return _divName;			
		}

		/**
		 * Hides the overlay (used when switching away from the timeout warning screen) 
		 */
		hideOverlay = function(){
			if(timeout_overlay){
				timeout_overlay.style.display = "none"; 
				activeElement.focus();
			}
			else{
				av.log.err("No overlay found");
			}	
		}

		/**
		 * Shows the overlay (used when switching to the timeout warning screen) 
		 */
		showOverlay = function(){
			if(timeout_overlay){
				timeout_overlay.style.display = "block";
			}
			else{
				av.log.err("No overlay found");
			}	 
		}

		/**
		 * Stops the countdown timer. 
		 */
		self.stopTimer = function(){
			//clear the interval and reset the id to null
			clearInterval(timeout_check_function);
			timeout_check_function = null;
		}
	
		/**
		 * Starts/Restarts the countdown timer, only if no other timer exists.	 
		 */
		self.restartTimer = function(){
			//check to ensure the timeout doesn't already exist
			if(!timeout_check_function){
				timeout_check_function = getNewCountDownInterval();
			}
		}
		
		//Initialization function to be run when the dom content is loaded.
		init = function () {
			if(userDefinedParameters){
				loadUniqueArguments();
			}
			if(typeof window.config.app.appTimeoutWarning === 'undefined'){window.config.app.appTimeoutWarning = defaultAppTimeoutWarning;} // Set the default ttime before showing the logout message
			if(typeof window.config.app.appTimeoutLogout === 'undefined'){window.config.app.appTimeoutLogout = defaultAppTimeoutLogout;} // The amount of time (in ms) to show the warning message	
			restartTimer();
			createOverlays();
		}();
		
		return self;			
	}
})(av);
}