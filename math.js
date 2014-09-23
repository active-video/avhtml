/**
 * @author Chad Wagner, c.wagner@avnetworks.com
 * @fileoverview MATH FUNCTIONS- provides methods to perform basic mathematical functions.
 * @version 1.0
 */
(function(av){
	
	/**
	 * @namespace <pre>MATH FUNCTIONS- provides methods to perform basic mathematical functions.
	 * 
	 * To begin using, call av.require('math');</pre>
	 */
	av.math = {
		/**
		 * @property
		 */
		version : '1.0.0',	
		/**
		 * Given 2 points in the cartesian plane, where the direction is from point 1 to point 2, return the length and angle of the vector (vector is centered at point 1)
		 * @return Object <pre>
		 * {
		 * 	r : "Length of vector", 
		 * 	theta : "direction, in degrees, of vector", 
		 * 	simpleDirection: '',//one of 'Up','Down','Left' or 'Right', 
		 * 	complexDirection: ''//one of 'e','ne','n','nw','w','sw','s','se'
		 * }</pre>
		 * @example av.math.cartesianToPolar(0,0,3,4);
		 * //results:
		 * {
		 * 	r : 5, 
		 * 	theta : 53.13010235415598, 
		 * 	simpleDirection: 'Up', 
		 * 	complexDirection: 'ne'
		 * }
		 */
		cartesianToPolar : function(x1, y1, x2, y2){
			//If only 1 point received, it is centered at the origin (0,0)
			if(typeof(x2) == 'undefined'){x2 = x1; x1 =0;}
			if(typeof(y2) == 'undefined'){y2 = y1; y1 =0;}
			//change of base so that we are dealing with a 0-rooted vector
			
			var x = (x2-x1),
				y = (y2-y1),
				hyp = Math.pow(x,2) + Math.pow(y,2),
				theta = 360 * ((Math.atan2(y,x) + 2*Math.PI) % (2*Math.PI)) / (Math.PI*2);
			av.log.debug('('+x+', '+y+') - length = Math.sqrt(' + hyp + ')');
			return {
				r 					: Math.sqrt(hyp),
				theta 				: theta,
				simpleDirection 	: (['Right','Up','Left','Down','Right'])[Math.round(theta/90)],
				complexDirection 	: (['e','ne','n','nw','w','sw','s','se','e'])[Math.round(theta/45)],
			}
		},
		
		degrees2Radians : function (deg) {
       		return deg % 360 * PI / 180;
	    },
	    
	    radians2Degrees : function (rad) {
	        return rad * 180 / Math.PI % 360;
	    },
			
				
		}

})(av);
