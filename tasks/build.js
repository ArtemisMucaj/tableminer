'use strict';
var pathUtil = require('path');
var Q = require('q');
var gulp = require('gulp');
var rollup = require('rollup');
var less = require('gulp-less');
var sass = require('gulp-sass');
var jetpack = require('fs-jetpack');

var source = require('vinyl-source-stream'); // Used to stream bundle for further handling
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify');
var concat = require('gulp-concat');

var projectDir = jetpack;
var srcDir = projectDir.cwd('./app');

var js_destDir = projectDir.cwd('./app/public/javascript');

var paths = {
  javascript : [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/foundation-sites/js/*.js'
  ]
}
// -------------------------------------
// Tasks
// -------------------------------------

// browserify
gulp.task('browserify', function() {
    var bundler = browserify({
        entries: ['./app/public/react/main.js'], // Only need initial file, browserify finds the deps
        transform: [reactify], // We want to convert JSX to normal javascript
        debug: true, // Gives us sourcemapping
        cache: {}, packageCache: {}, fullPaths: true // Requirement of watchify
    });
    var watcher  = watchify(bundler);

    return watcher
    .on('update', function () { // When any files update
        var updateStart = Date.now();
        watcher.bundle() // Create new bundle that uses the cache for high performance
        .pipe(source('main.js'))
    // This is where you add uglifying etc.
        .pipe(gulp.dest('./app/public/javascript/build/'));
         console.log('Bundling React files ... ', (Date.now() - updateStart) + 'ms');
    })
    .bundle() // Create the initial bundle when starting the task
    .pipe(source('main.js'))
    .pipe(gulp.dest('./app/public/javascript/build/'));
});

// Copy javascript files
gulp.task('copyjs', function() {
   gulp.src('./app/node_modules/jquery/dist/jquery.min.js')
   .pipe(gulp.dest('./app/public/javascript'));
   gulp.src('./app/node_modules/foundation-sites/js/*.js')
   .pipe(gulp.dest('./app/public/javascript/foundation'));
});

// less task
var lessTask = function () {
    return gulp.src('app/public/stylesheets/less/main.less')
    .pipe(less())
    .pipe(gulp.dest('app/public/stylesheets/css'));
};
gulp.task('less', lessTask);
gulp.task('less-watch', lessTask);

gulp.task('watch', function () {
    gulp.watch('app/public/stylesheets/less/*.less', ['less-watch']);
});
// sass task
var sassTask = function () {
  return gulp.src('app/public/stylesheets/sass/main.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest('app/public/stylesheets/css'));
};
gulp.task('sass', sassTask);
gulp.task('sass-watch', sassTask);

gulp.task('watch', function(){
  gulp.watch('app/public/stylesheets/sass/*.scss', ['sass-watch']);
});

// These are the running tasks
gulp.task('build', ['sass', 'copyjs', 'browserify']);
