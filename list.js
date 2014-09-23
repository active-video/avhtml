/**
 * @fileoverview Generic list interface definition, with scrolling and modal detail view.
 */

if(typeof(av.List) != 'function'){
	av.require('string','dom');
	av.List = function(config){
		var self = this;
		var config = av.mergeObjects(av.getConfig('list'), config, false);
		self.log = new av.Log(av.getEffectiveLogLevel('list'),'av.list');
		
		self.log.debug('config 1', config);
		
		//set config.holder to allow it to draw
		var defaultConfig = {
			itemHTML : '<article></article>',
			items : [],
			direction : 'vertical',
			chasing : true,
			detailsHTML : '',
		}
		
		self.set = function(configName, configValue){
			
		}
		
		config = av.mergeObjects(defaultConfig, config, false);
		self.log.debug('config 2', config);

		self.config = config;
		self.items = config.items;
		
		//self.items = config.items && config.items instanceof Array ? config.items : [];//initial list to work with - can be updated

		
		var log = new av.Log(av.getEffectiveLogLevel('list'),'av.list');
		
		self.draw = function(start, numToShow){
			var start 		= typeof(start) == 'number' ? start : 0;
			var numToShow 	= typeof(numToShow) == 'number' ? numToShow : 10000000;
			
			var list = self.getList(start, numToShow);
			var holder = config.holder ? av.dom.get(config.holder) : false;
			if(holder){
				holder.innerHTML = list.html;
				return true;
			}else{
				throw new TypeError("av.list.draw() expected the configuration to contain config.holder, a valid reference to a DOM element or ID to hold the list, but received: " + typeof(config.holder));
				//return false;
			}
		}
		
		self.getList = function(start, numToShow){
			var start 		= typeof(start) == 'number' ? start : 0;
			var numToShow 	= typeof(numToShow) == 'number' ? numToShow : 10000000;
			var template 	= self.getItemTemplate();
			
			var html = '';
			
			var prefix = 'avlist' + self.index;
			
			
			var end = Math.min(numToShow, self.items.length);
			//alert('end item = ' + self.items.length);
			for(var i=0; i<end; i++){
				var item = self.items[i];
				item.prefix = prefix+'Element';
				item.index = i;
				item.count = (i+1);
				item.previous = i ? (prefix + 'Element'+(i-1)) : '';
				item.next = i == end ? '' : prefix + 'Element' + (i+1);	
				item.id = i == end ? '' : prefix + 'Element' + i;	
				item.tabindex = i;
				
				html += "\n\t" + av.string.populateTemplate(template, item);
			}
			
			list = {
				html : html
			}
			
			self.log.debug("New HTML: ", html);
			
			self.index++;
			
			return list;
		}
		
		self.setItems = function(itemsArray){
			self.items = itemsArray;//private var items in the scope of instance
		}
		
		self.getItem = function(index){
			return self.items && (self.items instanceof Array) && self.items.length >= index ? self.items[index] : null;
		}
		
		self.getItemTemplate = function(){
			var template = config.itemHTML;
			if(!template){return '';}
			
			//tabindex for making non form elements focusable natively
			var top = topNew = av.string.trim(template.substring(0,template.indexOf('>')+1));
			self.log.debug('top=', top);
			var start = top.indexOf(' ');
			if(start == -1){start = top.indexOf('>');}//no attributes in tag
			
			self.log.debug('start',start);
			if(top.indexOf('tabindex') == -1){topNew = topNew.substring(0, start) + ' tabindex="[[tabindex]]"' + topNew.substring(start);}
			if(top.indexOf('id=') == -1){topNew = topNew.substring(0, start) + ' id="[[prefix]][[index]]"' + topNew.substring(start);}
			topNew = topNew.substring(0, start) + ' index="[[index]]"' + topNew.substring(start);
			
			if(config.chasing){
				//do we have a style property already in the parent node?
				var startStyle = topNew.indexOf('style="') != -1 ? topNew.indexOf('style="') + 7 : -1;
				var styleToAdd = '';
				self.log.debug('startStyle', startStyle)
				
				var directions = {
					previous : 'nav-' + (config.direction == 'vertical' ? 'up' : 'left'), 
					next : 'nav-' + (config.direction == 'vertical' ? 'down' : 'right')
				};
				if(top.indexOf(directions.previous) == -1){
					styleToAdd += directions.previous + ':[[previous]];'; 
				}
				if(top.indexOf(directions.next) == -1){
					styleToAdd += directions.next + ':[[next]];'; 
				}
				if(startStyle == -1 && styleToAdd != ''){
					topNew = topNew.substring(0, start) + ' style="'+styleToAdd+'"' + topNew.substring(start);
				}else if(styleToAdd != ''){//add to current style
					topNew = topNew.substring(0, startStyle) + styleToAdd + topNew.substring(startStyle);
				}	
			}//end if(config.chasing)
			return template.replace(top, topNew);
		}
		
		
		return self;
		
	}
	
	av.List.prototype.index = 0;
}
