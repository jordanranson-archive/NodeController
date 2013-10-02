ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font',
	'impact.debug.debug',

	'game.enums',
	'game.entities.node',

	'fss.fss'
)
.defines(function(){

var LIGHT = {
	count: 2,
	xyScalar: 1,
	zOffset: 150,
	ambient: '#222222',
	diffuse: '#444444',
	speed: 0.001,
	gravity: 1200,
	dampening: 0.95,
	minLimit: 10,
	maxLimit: null,
	minDistance: 20,
	maxDistance: 400,
	autopilot: true,
	draw: true,
	bounds: FSS.Vector3.create(),
	step: FSS.Vector3.create(
	  Math.randomInRange(0.2, 1.0),
	  Math.randomInRange(0.2, 1.0),
	  Math.randomInRange(0.2, 1.0)
	)
};


Game = ig.Game.extend({
	clearColor: '#222',
	playerColor: Color.green,
	playerAttacking: false,
	attackingNode: null,
	attackingForce: 0,

	zoom: 1,
	lastZoom: 1,
	dragStart: { x: 0, y: 0 },
	lastMouse: { x: 0, y: 0 },
	origin: { x: 0, y: 0 },
	mouse: { x: 0, y: 0 },
	bgCvs: null,
	bgCtx: null,
	bgPat: null,
	bgNoise: new ig.Image( 'media/noise.png' ),
	fss: {},


	fonts: {
		latoSmall: new ig.Font( 'media/lato.png' ),
		lato: new ig.Font( 'media/lato-medium.png' ),
		latoLight: new ig.Font( 'media/lato-light.png' )
	},


	init: function() {

		// create bg canvas
		this.bgCvs = ig.$new( 'canvas' );
		this.bgCvs.width = ig.system.width;
		this.bgCvs.height = ig.system.height;
		this.bgCtx = this.bgCvs.getContext( '2d' );

		this.fss.renderer = new FSS.CanvasRenderer( this.bgCvs );
		this.fss.scene = new FSS.Scene();

  		this.fss.attractor = FSS.Vector3.create();
		this.fss.center = FSS.Vector3.create();
  		FSS.Vector3.set( this.fss.center, this.fss.renderer.halfWidth, this.fss.renderer.halfHeight );

		this.fss.geometry = new FSS.Plane( ig.system.width, ig.system.height, ig.system.width/64, ig.system.height/64 );
		var v, vertex;
		for (v = this.fss.geometry.vertices.length - 1; v >= 0; v--) {
			vertex = this.fss.geometry.vertices[v];
			vertex.anchor = FSS.Vector3.clone(vertex.position);
			vertex.step = FSS.Vector3.create(
				Math.randomInRange(0.2, 1.0),
				Math.randomInRange(0.2, 1.0),
				Math.randomInRange(0.2, 1.0)
			);
			vertex.time = Math.randomInRange(0, Math.PIM2);
		}

		var material = new FSS.Material( '#000000', '#FFFFFF' );
		var mesh = new FSS.Mesh( this.fss.geometry, material );
		this.fss.scene.add( mesh );

		this.fss.light = new FSS.Light( '#222222', '#444444' );
		this.fss.scene.add( this.fss.light );

		this.fss.renderer.render( this.fss.scene );

		this.bgPat = this.bgCtx.createPattern( this.bgNoise.data, 'repeat' );



		ig.input.initMouse();
		ig.input.bind( ig.KEY.MOUSE1, 'action' );
		ig.input.bind( ig.KEY.MOUSE2, 'action2' );
		ig.input.bind( ig.KEY.MWHEEL_UP, 'zoomin' );
		ig.input.bind( ig.KEY.MWHEEL_DOWN, 'zoomout' );

		for( var i = 0; i < 7; i++ ) {
			this.spawnEntity( 'EntityNode', Math.random()*4096, Math.random()*4096, { data: (Math.random()*7+5)<<0 } );
		}
		this.spawnEntity( 'EntityNode', 0, 0, { team: Color.green, threads: 1, data: 30 } );
		this.spawnEntity( 'EntityNode', 1024*4, 1024*4, { team: Color.turquoise, threads: 1, data: 30 }  );
	},


	hexToRGBA: function( hex, a ) {
		hex = parseInt( hex.replace('#',''), 16 );
	    var r = hex >> 16;
	    var g = hex >> 8 & 0xFF;
	    var b = hex & 0xFF;
	    return 'rgba('+r+','+g+','+b+','+a+')';
	},
	

	update: function() {
		var attacking = false;
		for( var i = 0; i < this.entities.length; i++ ) {
			if( this.entities[i].attacking === true ) {
				attacking = true;
				break;
			}
		}
		this.playerAttacking = attacking;

		if( ig.input.pressed( 'action2' ) ) {
			this.dragStart.x = ig.input.mouse.x;
			this.dragStart.y = ig.input.mouse.y;
		}
		if( ig.input.state( 'action2' ) ) {
			this.screen.x -= (this.dragStart.x - ig.input.mouse.x)/ig.game.zoom;
			this.screen.y -= (this.dragStart.y - ig.input.mouse.y)/ig.game.zoom;
			this.dragStart.x = ig.input.mouse.x;
			this.dragStart.y = ig.input.mouse.y;
		}

		this.mouse.x = ig.input.mouse.x/this.zoom - (this.screen.x-this.origin.x);
		this.mouse.y = ig.input.mouse.y/this.zoom - (this.screen.y-this.origin.y);

	    // Animate Lights

		FSS.Vector3.set( this.fss.light.position, ig.input.mouse.x-ig.system.width/2, -ig.input.mouse.y+ig.system.height/2, 128 );

		var now = new Date().getTime();
		var offset = 5;
		var ox, oy, oz;
		for (v = this.fss.geometry.vertices.length - 1; v >= 0; v--) {
			vertex = this.fss.geometry.vertices[v];
			ox = Math.sin(vertex.time + vertex.step[0] * now * 0.001);
			oy = Math.cos(vertex.time + vertex.step[1] * now * 0.001);
			oz = Math.sin(vertex.time + vertex.step[2] * now * 0.001);
			FSS.Vector3.set(vertex.position,
			0*this.fss.geometry.segmentWidth*ox,
			0*this.fss.geometry.sliceHeight*oy,
			1*offset*oz - offset);
			FSS.Vector3.add(vertex.position, vertex.anchor);
		}
		this.fss.geometry.dirty = true;

		this.parent();
	},
	

	draw: function() {
		ig.system.context.fillStyle = this.clearColor;
		ig.system.context.fillRect( this.origin.x, this.origin.y, (ig.system.width/this.zoom), (ig.system.height/this.zoom) );

		this.drawBackground( this.origin.x, this.origin.y, (ig.system.width/this.zoom), (ig.system.height/this.zoom) );

		if( ( ig.input.state( 'zoomin' ) && this.zoom < 2 ) || ( ig.input.state( 'zoomout' ) && this.zoom > 0.1 ) ) {
			var mousex = ig.input.mouse.x;
		    var mousey = ig.input.mouse.y;
		    var wheel = ig.input.state( 'zoomin' ) ? 0.25 : -0.25;
		    var zoomScalar = Math.pow(1 + Math.abs(wheel)/2 , wheel > 0 ? 1 : -1);

			ig.system.context.translate( this.origin.x, this.origin.y );
			ig.system.context.scale( zoomScalar, zoomScalar );
			ig.system.context.translate(
		        -( mousex / this.zoom + this.origin.x - mousex / ( this.zoom * zoomScalar ) ),
		        -( mousey / this.zoom + this.origin.y - mousey / ( this.zoom * zoomScalar ) )
		    );

		    this.origin.x = ( mousex / this.zoom + this.origin.x - mousex / ( this.zoom * zoomScalar ) );
		    this.origin.y = ( mousey / this.zoom + this.origin.y - mousey / ( this.zoom * zoomScalar ) );
		    this.zoom *= zoomScalar;
		}
		
		this._rscreen.x = ig.system.getDrawPos(this.origin.x)/ig.system.scale;
		this._rscreen.y = ig.system.getDrawPos(this.origin.y)/ig.system.scale;

		for( var i = 0; i < this.entities.length; i++ ) {
			this.entities[i].draw();
		}
		for( var i = 0; i < this.entities.length; i++ ) {
			this.entities[i].drawUI();
		}
	},


	drawBackground: function( ox, oy, ow, oh ) {
		this.fss.renderer.render( this.fss.scene );

		this.bgCtx.save();
		this.bgCtx.globalAlpha = 0.075;
		this.bgCtx.fillStyle = this.bgPat;
		this.bgCtx.fillRect( -this.fss.renderer.halfWidth, -this.fss.renderer.halfHeight, ig.system.width, ig.system.height );
		this.bgCtx.restore();

		ig.system.context.drawImage( this.bgCvs, ox, oy, ow, oh );
	}
});

ig.main( '#canvas', Game, 60, 1024, 768, 1 );

});
