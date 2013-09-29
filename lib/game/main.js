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
	playerColor: Color.purple,
	playerAttacking: false,

	fonts: {
		latoSmall: new ig.Font( 'media/lato.png' ),
		lato: new ig.Font( 'media/lato-medium.png' ),
		latoLight: new ig.Font( 'media/lato-light.png' )
	},


	init: function() {
		ig.input.initMouse();
		ig.input.bind( ig.KEY.MOUSE1, 'action' );

		this.spawnEntity( 'EntityNode', 256, 384, { virus: 5, vaccine: 10, data: 10, threads: 1, production: 1 } );
		this.spawnEntity( 'EntityNode', 1024-256, 384, { team: Color.purple, virus: 100, data: 60, vaccine: 40, threads: 7, production: 1 } );
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
