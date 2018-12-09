#version 300 es

precision mediump float;

in vec2 f_texcoord;

uniform sampler2D diffuse_tex;

out vec4 c;

void main() {
    c = texture(diffuse_tex, f_texcoord);
}
