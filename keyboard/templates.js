av.nameSpace('av.keyboard.templates');
if(av.getProperty(av.keyboard.templates,'email','') == ''){

	/**
	 * Contains templates for use with av.keyboard.create(), load a template by name so it gets passed by value using av.keyboard.loadTemplate('templateName');
	 * @namespace av.keyboard.templates
	 */
	av.keyboard.templates = {};
	
	/**
	 * TEXT template, each key must be a string, or an object with at the least the property "value". Will use the default function addText unless otherwise defined
	 * @name text
	 * @property
	 * @type Object
	 * @memberOf av.keyboard.templates
	 */
	av.keyboard.templates.text = {
		defaultNavUp : -1,
		defaultNavRight: -1,
		defaultNavLeft: 1,
		panels : [
		     //Panel 1
		     {
		    	 name	: 'alpha',
		    	 shiftStates		: ["^shift","CAPS","lower"],
		    	 keys 	: [
			    	{value:'a',isDefault:true},'b','c','d','e','f','g','h','i','j',{value:'1',marginLeft:16},'2','3',{label:'@',value:'@', width:'80'/*,height:64*/,keyClass:'light', defaultNavLeft:-1},
			    	'k','l','m','n','o','p','q','r','s','t', {value:'4',marginLeft:16},'5','6',{label:'.com',value:'.com',noShift:true, width:80,keyClass:'light'},/**/
			    	{label:'^shift',uses:'shift',width:64,keyClass:'medium'},'u','v','w','x','y','z',{label:'clear',uses:'clear',width:64,keyClass:'medium'},{value:'7',marginLeft:16},'8','9',{label:'.net',value:'.net',width:'80',keyClass:'light',noShift:true},
			    	{label:'#+=',uses:'goToNextPanel',width:64,keyClass:'medium'},{label:'«',uses:'moveCursorLeft',keyClass:'medium'},{label:'space',value:' ',width:128,keyClass:'medium',noShift:true},{label:'»',uses:'moveCursorRight',keyClass:'medium'},{label:'delete',uses:'backspace',width:64, keyClass:'medium'},{value:'0',marginLeft:16},{label:'enter',uses:'submit', width:64,keyClass:'light'},{label:'cancel',width:'80',keyClass:'light', uses:'cancel'},
		    	 ]
		     },
		     
		     //Panel 2
		     {
		    	 name	: 'symbols',
		    	 keys 	: [
	    	      	'~','<','>','#','$','%','^','&','+','=',{value:'1',marginLeft:16},'2','3',{label:'@',value:'@', width:'80',keyClass:'light', defaultNavLeft:-1},
			    	'-','_','/',':',';','\\','[',']','{','}', {value:'4',marginLeft:16},'5','6',{label:'.com',value:'.com',noShift:true, width:80,keyClass:'light'},
			    	'.',',','?','!','\'','"','(',')','*','|',{value:'7',marginLeft:16},'8','9',{label:'.net',value:'.net',width:'80',keyClass:'light',noShift:true},
			    	{label:'Abc123',uses:'goToNextPanel',width:64,keyClass:'medium', isDefault:true},{label:'«',uses:'moveCursorLeft',keyClass:'medium'},{label:'space',value:' ',width:128,keyClass:'medium',noShift:true},{label:'»',uses:'moveCursorRight',keyClass:'medium'},{label:'delete',uses:'backspace',width:64, keyClass:'medium'},{value:'0',marginLeft:16},{label:'enter',uses:'submit', width:64,keyClass:'light'},{label:'cancel',width:'80',keyClass:'light', uses:'cancel'},
				 ]
		     },
		    
		],
	}

	/**
	 * EMAIL template
	 * @name email
	 * @property
	 * @type Object
	 * @memberOf av.keyboard.templates
	 */
	av.keyboard.templates.email = {
		
	}
	
	/**
	 * ZIPCODE template
	 * @name zip
	 * @property
	 * @type Object
	 * @memberOf av.keyboard.templates
	 */
	av.keyboard.templates.zip = {
			
	}
	
	/**
	 * SMILIES template
	 * @name smiley
	 * @property
	 * @type Object
	 * @memberOf av.keyboard.templates
	 */
	av.keyboard.templates.smiley = {
			
	}
	
	/**
	 * CAPTCHA template
	 * @name captcha
	 * @property
	 * @type Object
	 * @memberOf av.keyboard.templates
	 */
	av.keyboard.templates.captcha = {
			defaultNavUp : -1,
			defaultNavRight: -1,
			defaultNavLeft: 1,
			
			functions : {
				cantread : function(evt){
					av.log.debug("you should override the config functions.cantread function with your own handler");
				}
			},
			panels : [
			     //Panel 1
			     {
			    	 name	: 'alpha',
			    	 shiftStates		: ["^shift","CAPS","lower"],
			    	 keys 	: [
				    	{value:'a',isDefault:true},'b','c','d','e','f','g','h','i','j',{value:'1',marginLeft:16},'2','3',{label:"can't read", width:'80',height:64,keyClass:'light', defaultNavLeft:-1, noShift:true, uses:'cantread', style: 'padding-top:23px;'},
				    	'k','l','m','n','o','p','q','r','s','t', {value:'4',marginLeft:16},'5','6',
				    	{label:'^shift',uses:'shift',width:64,keyClass:'medium'},'u','v','w','x','y','z',{label:'clear',uses:'clear',width:64,keyClass:'medium'},{value:'7',marginLeft:16},'8','9',{label:'end',value:'end',width:'80',keyClass:'light',noShift:true, uses: 'moveCursorToEnd'},
				    	{label:'#+=',uses:'goToNextPanel',width:64,keyClass:'medium'},{label:'«',uses:'moveCursorLeft',keyClass:'medium'},{label:'space',value:' ',width:128,keyClass:'medium',noShift:true},{label:'»',uses:'moveCursorRight',keyClass:'medium'},{label:'delete',uses:'backspace',width:64, keyClass:'medium'},{value:'0',marginLeft:16},{label:'enter',uses:'submit', width:64,keyClass:'light'},{label:'cancel',width:'80',keyClass:'light', uses:'cancel'},
			    	 ]
			     },
			     
			     //Panel 2
			     {
			    	 name	: 'symbols',
			    	 keys 	: [
		    	      	'~','<','>','#','$','%','^','&','+','=',{value:'1',marginLeft:16},'2','3',{label:"can't read", width:'80',height:64,keyClass:'light', defaultNavLeft:-1, noShift:true, uses:'cantread', style: 'padding-top:23px;'},
				    	'-','_','/',':',';','\\','[',']','{','}', {value:'4',marginLeft:16},'5','6',
				    	'.',',','?','!','\'','"','(',')','*','|',{value:'7',marginLeft:16},'8','9',{label:'end',value:'end',width:'80',keyClass:'light',noShift:true, uses: 'moveCursorToEnd'},
				    	{label:'Abc123',uses:'goToNextPanel',width:64,keyClass:'medium', isDefault:true},{label:'«',uses:'moveCursorLeft',keyClass:'medium'},{label:'space',value:' ',width:128,keyClass:'medium',noShift:true},{label:'»',uses:'moveCursorRight',keyClass:'medium'},{label:'delete',uses:'backspace',width:64, keyClass:'medium'},{value:'0',marginLeft:16},{label:'enter',uses:'submit', width:64,keyClass:'light'},{label:'cancel',width:'80',keyClass:'light', uses:'cancel'},
					 ]
			     },
			    
			],
	},
		
		/**
		* COMPACT template
		* @name compact
		* @property
		* @type Object
		* @memberOf av.keyboard.templates
		*/
		
	av.keyboard.templates.compact = {
		defaultNavUp : -1,
		logLevel : 0,
		cursor : '__',
		cursorHTML : '__',
		defaultNavRight: -1,
		defaultNavLeft: 1,
		defaultNavDown: -1,
		width : 320,
		height : 304,
		keyWidth : 48,
		keyHeight : 48,
		maxCharacters : 12,
		navUp : false,
		navLeft : false,
		navDown : false,
		
		panels : [
		     //Panel 1
		     {
		    	 name	: 'alpha',
		    	 shiftStates		: ["^shift","CAPS","lower"],
		    	 keys 	: [
		    	 	{label:'Clear',width: 96, keyClass:'topLeft', uses : 'clear'}, {label:'Space', value : ' ',width: 96, keyClass:'topCenter'}, {label:'Delete', uses : 'backspace', width: 96, keyClass:'keyRight'},
			    	{value:'A',isDefault:true},'B','C','D','E','F',
			    	'G','H','I','J','K','L',
			    	'M','N','O','P','Q','R',
			    	'S','T','U','V','W','X',
			    	'Y','Z','"',{label:'123', alias : 'shownumbers', marginLeft: 48, uses:'goToNextPanel',width:96,keyClass:'keyRight'},
		    	 ]
		     },
		     
		     //Panel 2
		     {
		    	 name	: 'numbers',
		    	 keys 	: [
		    	 	{label:'Clear',width: 96, keyClass:'topLeft', uses : 'clear'}, {label:'Space', value : ' ',width: 96, keyClass:'topCenter'}, {label:'Delete', uses : 'backspace', width: 96, keyClass:'keyRight'},
	    	      	{value:'1',width: 96, keyClass:'numeric'}, {value:'2',width: 96, keyClass:'numeric'}, {value:'3',width: 96, keyClass:'numeric'},
	    	      	{value:'4',width: 96, keyClass:'numeric'}, {value:'5',width: 96, keyClass:'numeric'}, {value:'6',width: 96, keyClass:'numeric'},
	    	      	{value:'7',width: 96, keyClass:'numeric'}, {value:'8',width: 96, keyClass:'numeric'}, {value:'9',width: 96, keyClass:'numeric'},
	    	      	{value:'"',width: 96, keyClass:'numeric'}, {value:'0',width: 96, keyClass:'numeric'}, {label:'ABC',uses:'goToNextPanel',width:96,keyClass:'keyRight', isDefault:true},
				 ]
		     },
		    
			],	
	}
	
}