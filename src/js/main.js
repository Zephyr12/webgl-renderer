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

    $("#load_button").on("click", async () => {
        await scene.load_scene($("#select").val());
        scene.render();
    });

});
