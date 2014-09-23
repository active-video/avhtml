/**
 * @fileoverview Defines a new Object called av.JSONExplorer which helps in traversing JSON on screen 
 * (such as API testing, etc)
 */
if(!av.exists('av.JSONExplorer')){
	av.require('data.json','dom','string');
	
	/**
	 * @class A useful UI Widget that given an object, and an optional id (will insert at top level of 
	 * 	document.body if no id provided), generates a full JSON browser; this includes the ability to
	 * navigate up/down through the JSON object and hitting ENTER on any of the fields
	 * allows you to preview that value (text, image, or video)
	 * 
	 * @constructor
	 * @param {Object} obj A native JavaScript object to display on screen
	 * @param {String}
	 * @requires {@link av.dom} {@link av.data.json} {@link av.string}
	 */
	av.JSONExplorer = function(obj, id){
		var self = this;
		var elem;
		var curFocus = av.doc.activeElement;
		
		self.preview = null;
		
		var config = {
			width : ['width','w'],
			height : ['height','h'],
			videoExtensions : ['mp','wm','mov'],
			imageExtensions : ['bmp','jpg','gif','png','jpeg'],
			instructions : 'Press BACK or DELETE to close the JSON Explorer Window. Press ENTER from any video or image row to view.',
			version : '1.0.0',
		};
		
		self.log = new av.Log(av.getEffectiveLogLevel('jsonexplorer'),'av.jsonexplorer');
			
		//create the container and append to the body if not yet created
		var selfGeneratedContainer = av.dom.get('jsonexplorer');	
		if(!id && !selfGeneratedContainer){
			elem = av.doc.createElement('div');
			elem.id = 'jsonexplorer';
			av.doc.body.appendChild(elem);
		}else if(selfGeneratedContainer){
			elem = selfGeneratedContainer;
		}else{
			elem = av.dom.get(id);
		}
		av.dom.hide(elem);
		if(!elem.id){
			elem.id = 'JSONExplorerHolder';
		}
		
		var id = elem.id;
		
		
		
		self.show = function(){
			if(av.JSONExplorer.current){
				av.JSONExplorer.current.innerHTML = '';
			}else{
				av.JSONExplorer.current = elem;//static, only 1 instance allowed due to ID naming conventions
			}
			var rawInfo = self.rows = av.data.json.stringify(obj,null,4);
	
			var rawLines = self.rawLines = rawInfo.split("\n");
			
			//Put instructions at the top
			var instructions = av.doc.createElement('div');
			instructions.className = 'jsonexplorerInstructions';
			instructions.innerHTML = '<strong><em>AV JSONExplorer v' + config.version +'</em></strong>, ' + av.string.htmlEntities(config.instructions);
			elem.appendChild(instructions);
		
			//make a button for each row in the JSON for pretty exploration
			for(var i=0; i<rawLines.length; i++){
				var button = av.doc.createElement('button');
				var pre = av.doc.createElement('pre');
				var previous = 'detailButton' + (i-1);
				var next = 'detailButton' + (i+1);
				
				pre.appendChild(av.doc.createTextNode(rawLines[i]));
				button.appendChild(pre);
				
				button.style.navUp = '#'+previous;
				button.style.navDown = '#'+next;
				
				button.id = 'detailButton'+i;
				button.index = i;
				
				elem.appendChild(button);
				
			}
			av.log.debug("Showing parent for JSON Explorer: " + elem.id);
			
			elem.addEventListener('keydown', self.onKeyDown, false);
			
			av.dom.show(elem);
			
			
			av.dom.focus('detailButton0');
			elem.offsetParent.scrollTop = 0;//scroll into view
			
			
			var styleSelector = '#'+elem.id + ' button';
			av.html.loadGlobalCss(
				styleSelector + '{background-color:white; display:block; border-width:0; outline-width:0; width:100%; text-align:left;} ' + 
				styleSelector + ':focus{background-color:red;} ' +
				'#jsonexplorer{width:'+av.doc.body.offsetWidth+'px; height:'+av.doc.body.offsetHeight+'px; top:0; left:0; position:absolute; z-index:10000; background-color:white; overflow:hidden; padding:2.5%;}' +
				'#jsonexplorer .jsonexplorerInstructions{border-bottom:1px solid black;}'+
				'#jsonPreview{position:absolute; z-index:10001; outline:1px solid red; background-color:#333; color:#FFF;}' + 
				'.selectList{	position: absolute;	z-index:3;	top:0;	left:0;	width:100%;	height:100%;	margin:auto;	overflow:hidden;	background-color:rgba(0,0,0,0.5);}' +
				'.selectList .selectOptionHolder{height:50%;width:50%;margin:auto;overflow:hidden; }' +
				'.selectList h1{font-size:1.5em;text-align:center;padding:1% 1.5%; margin-bottom:1%; background-color:#FFF;	border:2px solid green;}' +
				'#jsonexplorer .selectList button{ width:90%; 	margin:auto;}' + 
				'#jsonexplorer img, #jsonexplorer video{margin:0; padding:0; border-width:0; outline-width:0;}'		
			);
		}
		
		self.onKeyDown = function(evt){
			if(evt.keyCode==8){
				self.close(evt);
				
				return false;
			}
			
			switch(av.getKeyIdentifier(evt)){
				case 'Enter':
					self.actUpon(evt.target.index);
					break;
			}
			
			evt.preventDefault();
			evt.stopPropagation();
		}
		
		self.getProperty = function(rawJson1LinerString){
			
			var row = av.string.trim(rawJson1LinerString);
			//find the key
			if(row.indexOf('":',1) != -1){
				var key = row.substring(1, row.indexOf('":',1));
			}else{
				var key = '';
			}
			
			var value = row.substring(key.length ? key.length + 3 : 0);
			if(value.lastIndexOf(',') == (value.length-1)){
				value = value.substring(0,value.length-1);
			}
			
			try{
				value = av.data.json.parse(value);
			}catch(eNotJSONSubtype){}
			//self.log.debug(rawJson1LinerString, key, value);
			return [key,value];
		}
		/**
		 * Only works for objects with "SIMPLE" values, such as strings, booleans, or numbers. Nested objects will self-terminate this functions effectiveness
		 */
		self.getSiblings = function(rowIndex){
			var siblings = {};
			//before me
			for(var i=rowIndex-1; i>0; i--){
				var rawRow = av.string.trim(self.rawLines[i]);
				if(self.isStop(rawRow)){break;}//all done, found parent object
				else{
					var data = self.getProperty(rawRow);
					siblings[data[0]] = data[1];	
				}
			}
			//after me
			for(var i=rowIndex+1; i<self.rawLines.length; i++){
				var rawRow = av.string.trim(self.rawLines[i]);
				if(self.isStop(rawRow)){break;}//all done, found parent object
				else{
					var data = self.getProperty(rawRow);
					siblings[data[0]] = data[1];	
				}
			}
			
			return siblings;
		}
		
		self.isStop = function(str){
			var isStop = (str == '{' || str == '[' || (str.lastIndexOf('[') == (str.length-1)) || (str.lastIndexOf('{') == (str.length-1))
					|| str == '}' || str == ']'  || (str.lastIndexOf('[') == 0) || (str.lastIndexOf('{') == 0)
					|| str.lastIndexOf('},') == (str.length-2) || str.lastIndexOf('],') == (str.length-2)   );
			return isStop;
		}
		
		self.close = function(evt){			
			elem.removeEventListener('keydown', self.onKeyDown, false);
			av.dom.hide(elem);
			av.log.debug("CLOSING JSON EXPLORER");
				
			//stop the event if it is a keydown triggering this	
			if(evt){
				evt.stopPropagation();
				evt.preventDefault();	
			}
			
			//refocus the last focused element
			if(curFocus){av.dom.focus(curFocus);}
		}
		
		self.actUpon = function(index){
			//var row = self.rows[index];
			//av.log.debug('currow: ', row);
			av.log.debug("Acting Upon Row Index: " + index);
			av.log.debug(self.getSiblings(index));
			
			var data = self.getProperty(self.rawLines[index]);
			var siblings = self.getSiblings(index);
			
			var metaData = self.getMetaData(data[0], data[1], siblings);
			av.log.debug("Metadata");
			av.log.debug(metaData);
		
			self.getOptions(metaData);
		}
		
		self.ask = function(divs, focus){
			
		}
		
		self.toSelectLists = function(ops, callback, selected){
			var divs = [], index=0;
			var optionsSelected = selected;
			var activeElement = av.doc.activeElement;
			
			self.log.debug(ops)
			var curDiv = 'selectList0';
			
			for(var prop in ops){
				var values = ops[prop];
				var div = av.doc.createElement('div');
				div.setAttribute('class', 'selectList');
				var selIndex = 'selectList' + index;
				div.setAttribute('id', selIndex);
				div.setAttribute('style', 'display:none;');
				
				var p = av.doc.createElement('h1');
				p.appendChild(av.doc.createTextNode("Select a " + prop + " (or hit BACK or LEFT to cancel the preview)"));
				div.appendChild(p);
				
				var cont = document.createElement('div')
				cont.setAttribute('class','selectOptionHolder');
				div.appendChild(cont);
				
				
				var focus = 0;
				var i=0;
				for(var val in values){
					var label = values[val];
					var b = av.doc.createElement('button');
					var prev = i != 0 ? selIndex + '_' + (i-1) : '';
					var me = selIndex + '_' + i;
					var next = selIndex + '_' + (i+1);
					b.setAttribute('id', me);
					b.setAttribute('style','nav-up:' + prev + '; nav-down:' + next + ';');
					b.setAttribute('value', val);
					
					if(val == selected[prop]){focus = i;}//update the default focus for this one to self
					
					b.innerHTML = label;
					
					cont.appendChild(b);
					
					i++;
				}
				
				elem.appendChild(div);
				div.ops = ops;
				div.next = 'selectList' + (index+1);
				div.selected = selIndex + '_' + focus;
				div.key = prop;
				//div.me = div;
				
				
				div.addEventListener('keydown', function(evt){
					var key = av.getKeyIdentifier(evt);
					var div = av.dom.get(curDiv);
					if(key == 'Enter'){
						self.log.debug(div);
						optionsSelected[div.key] = evt.target.value;
						//remove div from dom
						elem.removeChild(div);
						
						
						self.log.debug("Next div: " + div.next);
						
						var next = av.dom.get(div.next);
						if(next){
							self.log.debug("Focusing next div: " + next.id + " on element " + next.selected);
							av.dom.show(next);
							av.dom.focus(next.selected);	
							curDiv = next;
						}else{
							self.log.debug("Done getting options for preview, calling callback");
							callback(optionsSelected);
							delete divs;//remove divs from memory
						}
						
						evt.preventDefault();
						evt.stopPropagation();
						
					}else if(key == 'Left' || evt.keyCode ==8){
						for(var d in divs){
							elem.removeChild(divs[d]);
						}
						delete divs;//remove divs from memory
						evt.stopPropagation();
						evt.preventDefault();
						av.dom.focus(activeElement);
					}
				}, true);
				divs.push(div);
				index++;
			}
			av.dom.show(divs[0]);
			av.dom.focus(divs[0].selected);
		}
		
		self.getOptions = function(metaData){
			var activeElement = av.doc.activeElement;//where to return focus after done
			var maxWidth = av.doc.defaultView.innerWidth;
			var maxHeight = av.doc.defaultView.innerHeight;
			
			var ops = {
				type : {
					'video' : 'A Video Player',
					'img'	: 'An Image',
					'p'		: 'Text'
				},
				
				width : {},
				height : {},
				bpp : {},
			}
			for(var i=1; i<=Math.ceil(maxWidth/16); i++){
				var width = i*16;
				ops.width[width] = width + 'px';
			}
			
			for(var i=1; i<=Math.ceil(maxHeight/16); i++){
				var height = i*16;
				ops.height[height] = height + 'px';
			}
			
			for (var i=0; i<20; i++){ // from 0.0 to 19.9
				for (var j=0; j<10; j++){
					var bpp = i+"."+j;
					ops.bpp[bpp] = bpp;
				}
			}
			
			
			var cback = function(selection){
				self.log.debug("Selected")
				self.log.debug(selection)
				metaData.width = selection.width;
				metaData.height = selection.height;
				metaData.type = selection.type;
				metaData.bpp = selection.bpp;
				
				//show the video
				self.showPreview(metaData, activeElement);
			}
			var selected = {
				width: metaData.width ? Math.ceil(metaData.width/16)*16 : 320, 
				height: metaData.height ? Math.ceil(metaData.height/16)*16 : 240
			};
			self.log.debug('selected');
			self.log.debug(selected)
			
			self.toSelectLists(ops, cback, selected);
		}
		
		self.showPreview = function(metaData, activeElement){
			//calculate position
			var styles = {};
			var maxWidth = av.doc.defaultView.innerWidth;
			var maxHeight = av.doc.defaultView.innerHeight;
			
			self.log.debug("metaData", metaData);
			
			//width and left calculations
			if(metaData.width){
				styles.width = metaData.width + 'px';
				if(metaData.width < maxWidth){
					styles.left = ((maxWidth - metaData.width)/2);
				}else{
					styles.left = 0;
				}
				
			}else{
				styles.left = Math.ceil((maxWidth/4)/16)*16;
			}//end width/left
			
			
			//height and top calculations
			if(metaData.height){
				styles.height = metaData.height + 'px';
				if(metaData.width < maxHeight){
					styles.top = ((maxHeight - metaData.height)/2);
				}else{
					styles.top = 0;
				}
			}else{
				styles.top = Math.ceil((maxHeight/4)/16)*16;
			}
			
			//grid align
			styles.left = Math.ceil(styles.left/16)*16 + 'px';
			styles.top = Math.ceil(styles.top/16)*16 + 'px';
			
			
			//remove old preview if any
			if(self.preview){
				self.preview.parentNode.removeChild(self.preview);
			}
			
			if(metaData.type == 'video' || metaData.type == 'image' || metaData.type == 'p'){
				var preview = self.preview = av.dom.create(metaData.type, 'jsonPreview','jsonPreview',styles,false);
				if(metaData.type == 'video'){
					preview.autoplay = true;
					if (metaData.bpp){
						preview.setAttribute("bpp_scale",metaData.bpp);
					}									
				}else{
					
				}
				
				av.doc.body.appendChild(preview);

				if(metaData.type == 'p'){
					av.dom.set(preview, metaData.value)
				}else{
					preview.src = metaData.source ? metaData.source : metaData.value;	
				}
				
				preview.setAttribute('tabindex',0);
				
				preview.activeElement =  activeElement ? activeElement : av.doc.activeElement;
				preview.focus();
				
				preview.addEventListener('keydown', self.handlePreviewKeydown,false);
			}
			
		}
		
		self.handlePreviewKeydown = function(evt){
			//alert(evt.keyCode)
			if(evt.keyCode == 8){
				var toFocus = evt.target.activeElement;
				av.log.debug("Focusing " + toFocus.id + " but first let's close ourselve'");
				
				//a11 bug fix
				self.preview.volume = 0;
				
				evt.target.parentNode.removeChild(evt.target);
				self.preview = null;//remove reference
				
				av.log.debug("stopping defaults ");
				evt.preventDefault();
				evt.stopPropagation();
				
				av.log.debug("Focusing " + toFocus.id);
				toFocus.focus();
			}
		}
		
		self.getMetaData = function(key, value, siblings){
			var metaData = {};
			var v = value.toString().toLowerCase();
			//images are easy to spot, start there
			for(var i=0; i<config.imageExtensions.length; i++){
				if(v.indexOf('.'+config.imageExtensions[i]) != -1){
					metaData.type = 'image';
					metaData.source = value;
					
					var size = self.getSizes(siblings);
					//width is always set so that it fits
					metaData.width = size.width ? size.width : size.fallBackWidth;
					//we can ommit the height since browser will set it proportionally as needed (unless it is explicitly set in the metaData)
					if(size.height){metaData.height = size.height;}
					
					return metaData;
				}
			}
			
			//look for video
			for(var i=0; i<config.videoExtensions.length; i++){
				if(v.indexOf('.'+config.videoExtensions[i]) != -1){
					metaData.type = 'video';
					metaData.source = value;
					
					var size = self.getSizes(siblings);
					metaData.width = size.width
					metaData.height = size.height;
					
					return metaData;
				}
			}
			
			metaData.type = typeof(value);
			metaData.value = value;
			
			return metaData;
		}
		
		self.getSizes = function(metaData){
			var sizes = {};
			av.log.debug("Getting sizes from " + metaData);
			av.log.debug(metaData.width);
			//Sniff for width
			for(var i=0; i<config.width.length; i++){
				if(typeof(metaData[config.width[i]]) != 'undefined'){
					sizes.width = parseFloat(metaData[config.width[i]]);
				}
			}
			
			//Sniff for height
			for(var i=0; i<config.height.length; i++){
				if(typeof(metaData[config.height[i]]) != 'undefined'){
					sizes.height = parseFloat(metaData[config.height[i]]);
				}
			}
			
			if(!sizes.width){
				sizes.fallBackWidth = av.doc.body.offsetWidth/2;
			}
			
			if(!sizes.height){
				sizes.fallBackHeight = av.doc.body.offsetHeight/2;
			}
			
			return sizes;
		}
		
		self.show();
		
		return self;
	}
	
	av.JSONExplorer.current = '';
}
