/* 
   Timeline.js

   (Requires jquery, developed with jquery-1.4.4.min.js in mind)   

   Introducing an object oriented version of the Timeline application.
   New and improved features shall include:
   1. travelling forward and backward in time
   2. multiple calendars
*/

/*
  Timeline's two major functions are setup and draw. After instantiating a 
  timeline object, the developer calls setup() to initialize the object. Later,
  the developer repeatedly calls on draw() to animate the canvas.
  In between, resizing the window may trigger the resize() function which 
  adjusts the timeline's dimensions and other settings.
*/
function Timeline(){
    // constants
    Timeline._BORDER_SIDES = 20; // The border on each side of the timeline
    Timeline._BUTTON_WIDTH = 10; // The length of the back and forward buttons
    Timeline._WIDTH_FACTOR = 2/3; // How much height timeline should take up

    // variables
    Timeline._id = 0; // An id wich is unique for each instance of Timeline

    /*
      timeline.setup()
      Create canvas, back and forward button, as well as slider for scale.
      timeline_wrapper_id is the id of an element which is to contain this
      specific timeline.
     */    
    this.setup = function(timeline_wrapper_id){
	this._id = Timeline._id++; // get id, create next id for next instance
	this._timeline_wrapper_id = timeline_wrapper_id;
	this._canvas = document.createElement('canvas');
	this._canvas.setAttribute('id', 'canvas' + this._id);
	$('#' + timeline_wrapper_id).append(this._canvas);
    };

    /*
    this.resize = function(){
    };
    */

    /*
      timeline.draw()
      Update (or set for the first time) the styles of back and forward button,
      as well as the canvas.
      Assumes setup has been called.
     */
    this.draw = function(){
	// set canvas attributes
	
	// Width of canvas is window width, with space for borders either side.
	var canvas_width = $(window).width() - Timeline._BORDER_SIDES*2;
	var canvas_height = $(window).height()*Timeline._HEIGHT_FACTOR;


	/* The core feature of this block is the z-index. Everything else is 
	   there because otherwise I can't determine the z-index. At least 
	   that's what I read somewhere.

	   The z-index determines how overlapping elements are drawn.
	   The higher the z-index, the "closer to the user" the element is.

	   In this case, we want to draw everything on top of the canvas,
	   hence the lowest z-index in our application: 0.
	 */
	$('#canvas' + this._id).css({
	    width: canvas_width,
	    height: canvas_height,
	    border: '1px solid', // to see what's going on
	    position: 'relative', // "take canvas out of flow" - rough quote
	    top: '8px', // seems to be the chrome default
	    left: '8px', // ditto
	    'z-index': 0
	});
    };
}