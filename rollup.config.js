import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel'; // Will keep babel for now as per instructions
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts', // Changed to .ts
    output: [
        {
            file: 'dist/geotic.esm.js', // Common practice for ESM output
            format: 'es',
            sourcemap: true,
        },
        {
            file: 'dist/geotic.umd.js', // Common practice for UMD output
            format: 'umd',
            name: 'geotic', // Library name for UMD
            sourcemap: true,
            globals: {}, // Define globals if your library depends on external ones for UMD
        },
    ],
    plugins: [
        typescript({ tsconfig: './tsconfig.json' }), // Added TypeScript plugin
        babel(), // Keeping babel, ensure it processes TS output if needed (e.g. for older targets)
        commonjs(),
        resolve({ browser: true })
    ],
};
