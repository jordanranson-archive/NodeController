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


	fonts: {
		latoSmall: new ig.Font( 'media/lato.png' ),
		lato: new ig.Font( 'media/lato-medium.png' ),
		latoLight: new ig.Font( 'media/lato-light.png' )
	},


	init: function() {

		// create points for bg
		var numPoints = Math.round((ig.system.width/64+1)*(ig.system.height/64+1));
		this.bgPoints = new Float32Array( numPoints*2 );
		var row, col;
		for( var i = 0; i < this.bgPoints.length; i+=2 ) {
			col = (i/2) % (ig.system.width/64+1);
			row = ((i/2) / (ig.system.width/64+1)) << 0;

			this.bgPoints[i] = col*64;
			this.bgPoints[i+1] = row*64;
		}

		// create bg canvas
		this.bgCvs = ig.$new( 'canvas' );
		this.bgCvs.width = ig.system.width;
		this.bgCvs.height = ig.system.height;
		this.bgCtx = this.bgCvs.getContext( '2d' );

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
		this.bgCtx.clearRect( 0, 0, ig.system.width, ig.system.height );

		var x, y;
		for( var i = 0; i < this.bgPoints.length; i+=2 ) {
			x = this.bgPoints[i];
			y = this.bgPoints[i+1];

			this.bgCtx.beginPath();
			this.bgCtx.arc( x, y, 1, 0, Math.PI*2, true );
			this.bgCtx.closePath();
			this.bgCtx.fillStyle = '#ff0';
			this.bgCtx.fill();

			this.bgCtx.beginPath();
			this.bgCtx.moveTo( x, y );
			this.bgCtx.lineTo( x+64, y );
			this.bgCtx.lineTo( x+64, y );
			this.bgCtx.lineTo( x, y+64 );
			this.bgCtx.closePath();
			this.bgCtx.fillStyle = '#fff';
			this.bgCtx.fill();

			this.bgCtx.beginPath();
			this.bgCtx.moveTo( x, y );
			this.bgCtx.lineTo( x, y+64 );
			this.bgCtx.lineTo( x-64, y+64 );
			this.bgCtx.closePath();
			this.bgCtx.fillStyle = '#000';
			this.bgCtx.fill();
		}

		ig.system.context.drawImage( this.bgCvs, ox, oy, ow, oh );
	}
});

ig.main( '#canvas', Game, 60, 1024, 768, 1 );

});
