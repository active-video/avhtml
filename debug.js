/**
 * @fileoverview Provides on-screen debugging and automatically subscribes to a keyCode sequence
 */
if(!av.debug){
	/**
	 * Helper which will setup a kunami code listener, as well as other helpers
	 * @namespace
	 * 
	 */
	av.debug = new (function(){
		var self = this;
		var buffer = '';
		var bufferSize = 50;
		self.code = 'Up,Up,Down,Down,Left,Right,Left,Right';
		self.diagnosticsURL = 'http://www.amgapps.com/diagnostics/diagnostics_main/';
		
		
		self.version = '1.0.0';
		
		self.log = new av.Log(av.getEffectiveLogLevel('debug'),'av.debug');
		self.config = av.getConfig('debug');
		
		self.onKeyDown = function(evt){
			self.log.debug("Keydown in debug library detected!");
			var identifier = av.getKeyIdentifier(evt);
			if(identifier){
				buffer += ',' + identifier;
				//Detected Code?
				if(buffer.indexOf(self.code) != -1){
					self.log.debug("Showing Debug Screen, code detected");
					self.show();
					buffer = '';//clear buffer
				}
			}
			
			buffer = buffer.substr(-bufferSize);//last N characters
			self.log.debug("Current Buffer: " + buffer);
		} 
		
		
		
		self.show = function(){
			self.log.debug
			
			var info = {
				config : av.config,
				avhtml_versions : av.version().split("\n\t")
			}
			
			av.require('dom','jsonexplorer');
			
			var d = av.doc.createElement('div');
			var i = ++av.dom.index;
			d.id = 'debugViewer' + i;
			d.setAttribute('class', 'debugViewer');
			d.setAttribute('style',"position:absolute; background-color:rgba(0,0,0,0.8); top:0; left:0; width:100%; height:100%; color:#222; z-index:9999;");
			av.doc.body.appendChild(d);
			d.addEventListener('keydown', function(evt){
				evt.stopPropagation(); 
				evt.preventDefault();
				//EXIT?
				if(evt.keyCode == 8){
					av.doc.body.removeChild(d);
					
				//ONE?
				}else if(evt.keyIdentifier == av.keys.one){
					window.open(self.diagnosticsURL);
				}
			}, true);
			
			d.appendChild(av.doc.createTextNode('Debug Viewer ' + self.version + ", press 1 to launch diagnostics suite from " + self.diagnosticsURL));
			
			var jholder = av.doc.createElement('div');
			jholder.setAttribute('class', 'debugViewerJson');
			jholder.setAttribute('style',"position:absolute; top:10%; left:5%; width:90%; height:90%;");
			
			d.appendChild(jholder);
			
			av.html.loadGlobalCss("\n.debugViewer *{position:relative;}\n");
			
			new av.JSONExplorer(info, jholder);
		}
		
		self.init = function(){
			
			if(!self.config || (self.config && !self.config.disableDebugScreen)){
				av.addEventListener('keydown', self.onKeyDown);
			} 
			
			return self;
		}
		
		return self.init();
		
	})()
}
