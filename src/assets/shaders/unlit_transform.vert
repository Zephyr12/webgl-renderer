#version 300 es

in vec3 position;

uniform mat4 m;
uniform mat4 p;
uniform mat4 v;

out vec2 f_texcoord;
out float depth;

void main() {
    vec4 final_position = p * v * m * vec4(position, 1);
    gl_Position = vec4(final_position);
    depth = final_position.z;
    f_texcoord = 0.5 * (final_position.xy / final_position.w + vec2(1));
}
