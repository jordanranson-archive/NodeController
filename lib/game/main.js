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
	playerColor: Color.orange,
	playerAttacking: false,
	attackingNode: null,
	attackingForce: 0,

	zoom: 0.5,
	dragStart: { x: 0, y: 0 },

	fonts: {
		latoSmall: new ig.Font( 'media/lato.png' ),
		lato: new ig.Font( 'media/lato-medium.png' ),
		latoLight: new ig.Font( 'media/lato-light.png' )
	},


	init: function() {
		ig.input.initMouse();
		ig.input.bind( ig.KEY.MOUSE1, 'action' );
		ig.input.bind( ig.KEY.MOUSE2, 'action2' );
		ig.input.bind( ig.KEY.MWHEEL_UP, 'zoomin' );
		ig.input.bind( ig.KEY.MWHEEL_DOWN, 'zoomout' );

		this.spawnEntity( 'EntityNode', 128, 768/2, { team: Color.orange, virus: 25, data: 25, vaccine: 25, threads: 3 } );
		this.spawnEntity( 'EntityNode', 1024-128, 768/2, { team: Color.orange, virus: 25, data: 25, vaccine: 25, threads: 3 } );
	},


	hexToRGBA: function(hex,a){
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

		if( ig.input.state( 'zoomin' ) ) this.zoom += 0.1;
		if( ig.input.state( 'zoomout' ) ) this.zoom -= 0.1;
		this.zoom = this.zoom.limit( 0.1, 2 );

		if( ig.input.pressed( 'action2' ) ) {
			this.dragStart.x = ig.input.mouse.x;
			this.dragStart.y = ig.input.mouse.y;
		}
		if( ig.input.state( 'action2' ) ) {
			this.screen.x += (this.dragStart.x - ig.input.mouse.x)/ig.game.zoom;
			this.screen.y += (this.dragStart.y - ig.input.mouse.y)/ig.game.zoom;
			this.dragStart.x = ig.input.mouse.x;
			this.dragStart.y = ig.input.mouse.y;
		}

		this.parent();
	},
	

	draw: function() {
		this.parent();
		
		var x = ig.system.width/2,
			y = ig.system.height/2;
	}
});

ig.main( '#canvas', Game, 60, 1024, 768, 1 );

});
