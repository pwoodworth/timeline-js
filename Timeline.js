/* 
   Timeline.js

   (Requires jquery, developed with jquery-1.4.4.min.js in mind)   
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
    Timeline._BORDER_SIDES = 20; // The border on each side of the timeline,
    // We'll need this value later when calculating back's top offset
    Timeline._OFFSET_LEFT = '8px'; 
    Timeline._OFFSET_TOP = '8px'; // top border, 8px seems to be chrome default
    Timeline._BUTTON_WIDTH = 17; // The length of the back and forward buttons
    Timeline._WIDTH_FACTOR = 2/3; // How much height timeline should take up
    // variables
    Timeline._id = 0; // An id wich is unique for each instance of Timeline

    /* This function is called when the user clicks the back div*/
    this._backHandler = function(){
	alert('back clicked');
    };

    this._testResize = function(){
	alert('resized');
    };


    /*
      timeline.setup()
      Create canvas, back and forward button, as well as slider for scale.
      timeline_wrapper_id is the id of an element which is to contain this
      specific timeline.
     */    
    this.setup = function(timeline_wrapper_id){
	// add canvas
	this._id = Timeline._id++; // get id, create next id for next instance
	this._timeline_wrapper_id = timeline_wrapper_id;
	this._canvas = document.createElement('canvas');
	this._canvas.setAttribute('id', 'canvas' + this._id);
	$('#' + timeline_wrapper_id).append(this._canvas);

	// add back button
	this._back = document.createElement('div');
	this._back.setAttribute('id', 'back' + this._id); 
	// id's help us jquery stuff, ensuring their unique across instances
	// lets us potentially put several instance on the same page.

	this._back.onclick = this._backHandler; // set event handler: onclick
	$('#' + timeline_wrapper_id).append(this._back);


	this._resizeHandler = function(){
	    // First, we clear all style so as to prevent duplicates
	    $('#canvas' + this._id).removeAttr('style');
	    $('#back' + this._id).removeAttr('style');
	    // later we'll insert an empty style before modifying the style.
	    
	    
	    // set canvas attributes
	    
	    // Width of canvas is window width, with space for borders either 
	    // side.
	    var canvas_width = $(window).width() - Timeline._BORDER_SIDES*2;
	    var canvas_height = $(window).height() * Timeline._HEIGHT_FACTOR;
	    
	    
	    /* The core feature of this block is the z-index. Everything else 
	       is there because otherwise I can't determine the z-index. At 
	       least that's what I read somewhere.
	       
	       The z-index determines how overlapping elements are drawn.
	       The higher the z-index, the "closer to the user" the element is.
	       
	       In this case, we want to draw everything on top of the canvas,
	       hence the lowest z-index in our application: 0.
	    */
	    $('#canvas'+this._id).attr('style', ''); 
	    // this undoes our removeAttr('style') from earlier

	    $('#canvas' + this._id).css({
		width: canvas_width,
		height: canvas_height,
		border: '1px solid', // to see what's going on
		position: 'relative', // "take canvas out of flow"-rough quote
		top: Timeline._BORDER_TOP, // seems to be the chrome default
		left: Timeline._BORDER_LEFT, // ditto
		'z-index': 0
	    });
	    
	    /* Here we define the back button's visual properties. 
	       Where possible, we calculate them in terms of canvas attributes,
	       to achieve a consistent layout as the browser is resized.
	    */
	    var back_left = $('#canvas' + this._id).css('left') + 'px'; 
	    // same distance from left timeline_wrapper as canvas
	    
	    // This one is a little more difficult: An explanation will follow
	    // as soon as I've figured it out myself.
	    var back_top = ((-1)*$('#canvas' + this._id).height() - 6) + 'px';
	    
	    $('#back' + this._id).attr('style', ''); 
	    $('#back' + this._id).css({
		'background-color': '#336699',
		width: Timeline._BUTTON_WIDTH,
		height: $('#canvas' + this._id).height(), // fill canvas height
		position: 'relative', // same reason as for canvas
		left: back_left,
		top: back_top,
		'z-index': 1
	    });
	};
	
	
	this._resizeHandler();
	$(window).resize(this._resizeHandler);
    };

    /*
      timeline.draw()
      Update (or set for the first time) the styles of back and forward button,
      as well as the canvas.
      Assumes setup has been called.
     */
    this.draw = function(){
	console.log('dummy');
    };
}