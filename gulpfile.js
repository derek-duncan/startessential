var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    livereload = require('gulp-livereload'),
    source = require('vinyl-source-stream'), // Used to stream bundle for further handling
    browserify = require('browserify'),
    watchify = require('watchify'),
    reactify = require('reactify'),
    es6ify = require('es6ify'),
    notify = require('gulp-notify');

// TASKS //

gulp.task('browserify', function() {

  es6ify.traceurOverrides = {experimental: true};
  // Our app bundler
	var appBundler = browserify({
		entries: ['assets/js/app.jsx'], // Only need initial file, browserify finds the rest
		cache: {}, packageCache: {}, fullPaths: true
	})
  .transform(reactify, {es6: true});

  // The rebundle process
  var rebundle = function () {
    var start = Date.now();
    appBundler.bundle()
      .on('error', function(err) {
        notify().write(err);
      })
      .pipe(source('app.min.js')) // Name of the build file
      .pipe(gulp.dest('assets/js/build/'))
      .pipe(livereload())
      .pipe(notify('JS ✅ ' + (Date.now() - start) + 'ms'));
  };
  // Fire up Watchify when developing
  appBundler = watchify(appBundler);
  appBundler.on('update', rebundle);

  rebundle();
})

gulp.task('styles', function() {
  return gulp.src('assets/scss/**/*.scss')
    .pipe(sass({ style: 'expanded' }))
    .pipe(autoprefixer('last 2 version'))
    .pipe(gulp.dest('assets/css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
    .pipe(gulp.dest('assets/css'))
    .pipe(livereload())
    .on('error', function(err) {
      notify().write(err)
    });
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('assets/scss/**/*.scss', ['styles']);
});

gulp.task('default', ['styles', 'browserify', 'watch'], function() {

});
