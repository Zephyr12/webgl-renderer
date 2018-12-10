#version 300 es

in vec3 position;
in vec3 normal;
in vec2 texcoord;

uniform mat4 m;
uniform mat4 p;
uniform mat4 v;

out vec4 f_normal;
out vec2 f_texcoord;

void main() {
    mat4 mvp = p * v * m;
    gl_Position = mvp * vec4(position,1);
    f_normal = vec4((mvp * vec4(normalize(normal), 0)).xyz, gl_Position.z);
    f_normal.xyz = normalize(f_normal.xyz);
    f_texcoord = texcoord;
}
