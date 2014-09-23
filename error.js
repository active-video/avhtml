/**
 * @fileoverview Defines a error interface
 */
if(!av.exists('av.errorScreen')){

	/**
	 * @namespace Provides an interface for a configurable error screen. 
	 * 
	 */
	 av.errorScreen = new (function(){
		/**
		 * @fileoverview Defines a error interface
		 */
		//	Application Initialization Variables		
		var error_check_function; //The id of the setInterval Function
		var error_overlay; //The div containing the error information
		var error_text; //The div contining the text relaying the about of time left before the window close.		
		var	error_headerText; //The div containing the header information in the text box.
		var	error_bodyText; //The div containing the body information in the text box.
		var userDefinedParameters = arguments[0];		
		
		//Set the default parameters for the screen overlay
		var defaultStyleObject_overlay = {
			"z-index" : "30000",
			"display" : "none",
			"width" : "100%",		
			"height" : "100%",				
			"backgroundColor" : "rgba(0, 0, 0, 0.8)",				
			"color" : "white",				
			"position" : "absolute",				
			"top" : "0px",				
			"left" : "0px",	
		};
		
		//Set the default parameters for the error textbox
		var defaultStyleObject_errorText = {
			"font-family" : "\"Liberation Sans\",\"Helvetica Neue\", \"Helvetica\", \"MgOpen Moderna\", \"Arial\", sans-serif",
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
		
		var defaultStyleObject_errorHeaderText = {
			"text-align" : "left",
			"font-size" : "26pt",	
			"font-weight" : "bold",				
			"color" : "#586463",
			"backgroundColor" : "transparent",
		};
		
		var defaultStyleObject_errorBodyText = {
			"display": "inline",
			"padding-top" : "0",				
			"text-align" : "left",
			"font-size" : "16pt",
			"font-weight" : "bold",								
			"color" : "#bbcecc",						
			"line-height" : "2.5",
			"backgroundColor" : "transparent",
		};
				
		//Updates the error object with user-specified arguments.
		loadUniqueArguments = function(){
			if((userDefinedParameters["screenOverlay"])){		
				for (var property in userDefinedParameters["screenOverlay"]){
	    			defaultStyleObject_overlay[property] = userDefinedParameters["screenOverlay"][property];
				}	
			}
			if((userDefinedParameters["textOverlay"])){		
				for (var property in userDefinedParameters["textOverlay"]){
	    			defaultStyleObject_errorText[property] = userDefinedParameters["textOverlay"][property];
				}	
			}
			if((userDefinedParameters["textOverlay_header"])){		
				for (var property in userDefinedParameters["textOverlay_header"]){
	    			defaultStyleObject_errorHeaderText[property] = userDefinedParameters["textOverlay_header"][property];
				}	
			}
			if((userDefinedParameters["textOverlay_body"])){		
				for (var property in userDefinedParameters["textOverlay_body"]){
	    			defaultStyleObject_errorBodyText[property] = userDefinedParameters["textOverlay_body"][property];
				}	
			}
		}; 		
		
		//The event listener for keypresses.
		//Updates the most recent keypress
		window.addEventListener("keydown",function(event){
			if(error_overlay){
				if(error_overlay.style.display == "block"){
					hideOverlay_error();
				}
			}
		}, true);

		/**
		 * Builds the overlay scrren components that will appear above the current application when the error warning occurs. 
		 */		
		createOverlay_error = function(){
			//Create the div objects
			error_overlay = buildDiv("error_overlay", defaultStyleObject_overlay);
			error_text = buildDiv("error_textDiv", defaultStyleObject_errorText);
			error_headerText = buildDiv("error_headerTextDiv", defaultStyleObject_errorHeaderText,"Attention");
			error_bodyText = buildDiv("error_bodyTextDiv", defaultStyleObject_errorBodyText);
			
			//Organize the heirarchy
			error_text.appendChild(error_headerText);	
			error_text.appendChild(error_bodyText);	
			error_overlay.appendChild(error_text);	
			document.getElementsByTagName('body')[0].appendChild(error_overlay);
			
			//Store a pointer to the objects in local memory
			error_headerText = document.getElementById("error_headerTextDiv");
			error_bodyText = document.getElementById("error_bodyTextDiv");
			error_overlay = document.getElementById("error_overlay");
			error_text = document.getElementById("error_textDiv");
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
		 * Hides the overlay (used when switching away from the error warning screen) 
		 */
		hideOverlay_error = function(){
			if(error_overlay){
				document.getElementsByTagName('body')[0].removeChild(error_overlay);
				error_overlay = null;
			}
			else{
				av.log.err("No overlay found");
			}	
		}

		/**
		 * Shows the overlay (used when switching to the error warning screen) 
		 */
		showOverlay_error = function(){
			if(error_overlay){
				error_overlay.style.display = "block";
			}
			else{
				av.log.err("No overlay found");
			}	 
		}

		/**
		 * Builds and shows an error message
		 */
		self.showErrorMessage = function(errMsg){			
			if(userDefinedParameters){
				loadUniqueArguments();
			}
			createOverlay_error();
			showOverlay_error();
			error_bodyText.innerHTML = errMsg;
			console.log(errMsg);
		}
		return self;			
	}
)};