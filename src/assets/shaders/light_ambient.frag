#version 300 es

precision mediump float;

in vec2 f_texcoord;

uniform sampler2D diffuse_tex;
uniform vec3 col;

out vec3 c;

void main() {
    c = texture(diffuse_tex, f_texcoord).xyz* col;
}
