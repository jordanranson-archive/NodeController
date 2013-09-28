ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font',

	'game.enums',
	'game.entities.node',

	'fss.fss'
)
.defines(function(){

Game = ig.Game.extend({
	clearColor: '#222',
	fonts: {
		lato: new ig.Font( 'media/lato.png' ),
		latoLight: new ig.Font( 'media/lato-light.png' )
	},


	init: function() {
		ig.input.initMouse();
		ig.input.bind( ig.KEY.MOUSE1, 'action' );

		this.spawnEntity( 'EntityNode', 128+25, 128+25, { virus: 1, vaccine: 1, data: 5, threads: 2 } );
		this.spawnEntity( 'EntityNode', 896-100, 128+100, { virus: 100, vaccine: 100, data: 100, threads: 7 } );
		this.spawnEntity( 'EntityNode', 512-120, 640-56, { team: Color.red } );
	},
	

	update: function() {
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
