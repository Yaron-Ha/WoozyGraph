import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 9001
    },
    build: {
        outDir: './docs' // for github pages
    }
})
