ig.module(
	'game.entities.3d'
)
.requires(
	'impact.entity',
    'game.enums'
)
.defines(function(){

Entity3d = ig.Entity.extend({
    size: { x: 16, y: 16 },
    team: 0,
    active: true,

    init: function( x, y, settings ) {
        this.parent( x, y, settings );
    },
    
    
    init3d: function() {
        this.marker = new THREE.Object3D();

        var color1 = 
            this.team === Team.NONE ? 0x666666 :
            this.team === Team.RED ? 0xff0000 :
            this.team === Team.GREEN ? 0x00ff00 :
            this.team === Team.BLUE ? 0x0000ff :
            this.team === Team.PURPLE ? 0xff00ff :
            this.team === Team.ORANGE ? 0xff8800 :
            0x00ffff;
        var color2 = 
            this.team === Team.NONE ? 0x666666 :
            this.team === Team.RED ? 0x880000 :
            this.team === Team.GREEN ? 0xffff00 :
            this.team === Team.BLUE ? 0x668888 :
            this.team === Team.PURPLE ? 0x0088ff :
            this.team === Team.ORANGE ? 0xff0088 :
            0x8866ff;

        // tile marker
        var mesh = new THREE.Mesh(
            new THREE.PlaneGeometry( 14, 14 ), 
            new THREE.MeshBasicMaterial({
                color: color1,
                wireframe: true,
                shading: THREE.FlatShading
            })
        );
        mesh.overdraw = true;
        mesh.position.x = (this.pos.x + this.size.x*0.5);
        mesh.position.y = -(this.pos.y + this.size.y*0.5);
        mesh.position.z = 0.1;
        mesh.name = 'tile-marker';
        this.marker.add( mesh );

        // crystal
        mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry( 8 ), 
            new THREE.MeshLambertMaterial({
                color: 0xdddddd,
                wireframe: !this.active,
                shading: THREE.FlatShading
            })
        );
        mesh.overdraw = true;
        mesh.position.x = (this.pos.x + this.size.x*0.5);
        mesh.position.y = -(this.pos.y + this.size.y*0.5);
        mesh.position.z = 16;
        mesh.name = 'crystal';
        this.marker.add( mesh );

        var light = new THREE.SpotLight( color1, 1.25 );
        light.position.x = (this.pos.x + this.size.x*0.5);
        light.position.y = -(this.pos.y + this.size.y*0.5);
        light.position.z = 64;
        light.target = mesh;
        ig.game.level.add( light );

        light = new THREE.SpotLight( color2, 0.75 );
        light.position.x = (this.pos.x + this.size.x*0.5);
        light.position.y = -(this.pos.y + this.size.y*0.5) - 32;
        light.position.z = 64;
        light.target = mesh;
        ig.game.level.add( light );

        light = new THREE.PointLight( color1, 0.25 );
        light.position.x = (this.pos.x + this.size.x*0.5);
        light.position.y = -(this.pos.y + this.size.y*0.5);
        light.position.z = 4;
        ig.game.level.add( light );

        ig.game.level.add( this.marker );
    },

    update: function() {
        this.parent();

        var crystal = this.marker.getObjectByName( 'crystal' );
        crystal.rotation.x += 0.02;
        crystal.rotation.y += 0.0225;
        crystal.rotation.z += 0.0175;
    }
});

});