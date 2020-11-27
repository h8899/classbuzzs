module.exports = (grunt) => {
    grunt.initConfig({
      imagemin: {
        png: {
          options: {
            optimizationLevel: 7,
          },
          files: [
            {
              expand: true,
              cwd: 'src/images/',
              src: ['**/*.png'],
              dest: 'src/compressed_images/',
              ext: '.png',
            },
          ],
        },
        jpg: {
          options: {
            progressive: true,
          },
          files: [
            {
              expand: true,
              cwd: 'src/images/',
              src: ['**/*.jpg', '**/*.jpeg'],
              dest: 'src/compressed_images/',
              ext: '.jpg',
            },
          ],
        },
        svg: {
            options: {
                svgoPlugins: [
                    { removeViewBox: true },
                    { removeUselessStrokeAndFill: true },
                    { removeEmptyAttrs: true },
                ],
            },
            files: [
              {
                expand: true,
                cwd: 'src/images/',
                src: ['**/*.svg'],
                dest: 'src/compressed_images/',
                ext: '.svg',
              },
            ],
        },
        gif: {
            options: {
                interlaced: true,
            },
            files: [
              {
                expand: true,
                cwd: 'src/images/',
                src: ['**/*.gif'],
                dest: 'src/compressed_images/',
                ext: '.gif',
              },
            ],
        },
      },
});

grunt.loadNpmTasks('grunt-contrib-imagemin');
grunt.registerTask('default', ['imagemin']);
};
