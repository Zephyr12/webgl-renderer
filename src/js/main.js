gl = null;
debug_framebuffer = 0

$(document).ready(() => {
    /*
     * An init function, essentially initalize OpenGL here
     */


    let canvas = $("canvas")[0];
    gl = canvas.getContext('webgl2');
    if (gl === null) {
        alert("Your browser does not support webgl");
    }
    
    var linear = gl.getExtension("OES_texture_float_linear");
    if (!linear) {
        alert("this machine or browser does not support  OES_texture_float_linear");
        return;
    }

    var render_float = gl.getExtension("EXT_color_buffer_float");
    if (!render_float) {
        alert("this machine or browser does not support  EXT_color_buffer_float");
        return;
    }
    
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    mat  = new MaterialLoader();
    tex  = new TextureLoader();
    mesh = new MeshLoader();
    scene = new SceneLoader();
    scene.load_scene("monkey_pl.json");
    scene.load_scene("monkey_dl.json");


    $("#load_button").on("click", () => {
        let p = scene.load_scene($("#select").val());
        p.then(()=> {
            requestAnimationFrame(()=>scene.render());
        });
    });

    document.addEventListener('keydown', function(event) {
        let rot_y = 0;
        if(event.keyCode == 39) {
            rot_y -= 1;
        }
        else if(event.keyCode == 37) {
            rot_y += 1;
        }
        scene.traverse("scene", scene.scene_root, mat4.create(), (scene, m, scene_node) => {
            vec3.add(scene_node.rot, scene_node.rot, vec3.fromValues(0, rot_y * 20, 0));
            let rot = quat.fromEuler(quat.create(), scene_node.rot[0], scene_node.rot[1], scene_node.rot[2]);
            let loc = scene_node.loc;
            let sca = scene_node.sca;
            scene_node.m   = mat4.fromRotationTranslationScale(mat4.create(),rot, loc, sca);
        });
    });

});
