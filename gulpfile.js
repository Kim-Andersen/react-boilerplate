'use strict';

var gulp = require('gulp');
var source = require('vinyl-source-stream'); // Used to stream bundle for further handling
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify'); 
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var notify = require('gulp-notify');
var concat = require('gulp-concat');
var cssmin = require('gulp-cssmin');
var gutil = require('gulp-util');
var shell = require('gulp-shell');
var glob = require('glob');
var livereload = require('gulp-livereload');
var jasminePhantomJs = require('gulp-jasmine2-phantomjs');
var connect = require('gulp-connect');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps   = require('gulp-sourcemaps');
var inject = require('gulp-inject');
var rev = require('gulp-rev');
var buffer = require('gulp-buffer');
var del = require('del');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var htmlmin = require('gulp-htmlmin');

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
  'react',
  'react/addons'
];

var path = {
  buildDir: './build',
  deployDir: './dist',
  sassDir : './sass'
};

var development = true;

gulp.task('browserifyTask', function () {

  var dest = development ? path.buildDir : path.deployDir;

  // Our app bundler
  var appBundler = browserify({
    entries: ['./app/main.js'], // Only need initial file, browserify finds the rest
    transform: [reactify], // We want to convert JSX to normal javascript
    debug: development, // Gives us sourcemapping
    cache: {}, 
    packageCache: {}, 
    fullPaths: development // Requirement of watchify
  });

  // We set our dependencies as externals on our app bundler when developing    
  (development ? dependencies : []).forEach(function (dep) {
    appBundler.external(dep);
  });

  // The rebundle process
  var rebundle = function () {
    var start = Date.now();
    console.log('Building APP bundle');
    return appBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('main.js'))
      .pipe(gulpif(!development, streamify(uglify())))
      .pipe(gulpif(!development, buffer()))
      .pipe(gulpif(!development, rev()))
      .pipe(gulp.dest(dest))
      .pipe(gulpif(development, livereload()))
      .pipe(notify(function () {
        console.log('APP bundle built in ' + (Date.now() - start) + 'ms');
      }));
  };

  // Fire up Watchify when developing
  if (development) {
    appBundler = watchify(appBundler);
    appBundler.on('update', rebundle);
  }
  
  if (!development) {
    return rebundle();  
  }
  else {
    rebundle();
  
    // We create a separate bundle for our dependencies as they
    // should not rebundle on file changes. This only happens when
    // we develop. When deploying the dependencies will be included 
    // in the application bundle

    var testFiles = glob.sync('./specs/**/*-spec.js');
    var testBundler = browserify({
      entries: testFiles,
      debug: true, // Gives us sourcemapping
      transform: [reactify],
      cache: {}, packageCache: {}, fullPaths: true // Requirement of watchify
    });

    dependencies.forEach(function (dep) {
      testBundler.external(dep);
    });

    var rebundleTests = function () {
      var start = Date.now();
      console.log('Building TEST bundle');
      testBundler.bundle()
      .on('error', gutil.log)
        .pipe(source('specs.js'))
        .pipe(gulp.dest(dest))
        .pipe(livereload())
        .pipe(notify(function () {
          console.log('TEST bundle built in ' + (Date.now() - start) + 'ms');
        }));
    };

    testBundler = watchify(testBundler);
    testBundler.on('update', rebundleTests);
    rebundleTests();

    // Remove react-addons when deploying, as it is only for
    // testing
    if (!development) {
      dependencies.splice(dependencies.indexOf('react-addons'), 1);
    }

    var vendorsBundler = browserify({
      debug: true,
      require: dependencies
    });
    
    // Run the vendor bundle
    var start = new Date();
    console.log('Building VENDORS bundle');
    return vendorsBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('vendors.js'))
      .pipe(gulpif(!development, streamify(uglify())))
      .pipe(gulp.dest(dest))
      .pipe(notify(function () {
        console.log('VENDORS bundle built in ' + (Date.now() - start) + 'ms');
      })); 
  }
});

gulp.task('cssTask', function() {

  var src = path.sassDir+'/**/*.scss',
      autoprefixerOptions = {browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4']};

  if(development) {
    var run = function () {
      console.log(arguments);
      var start = new Date();
      console.log('Building CSS bundle');
      return gulp.src(src)
        .pipe(sass({errLogToConsole: true}).on('error', sass.logError))
        .pipe(sourcemaps.init())
        .pipe(autoprefixer(autoprefixerOptions))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.buildDir))
        .pipe(notify(function () {
          console.log('Sass bundle built in ' + (Date.now() - start) + 'ms');
        }));
    };
    run();
    gulp.watch(src, run);
  } else {
    return gulp.src(src)
      .pipe(sass({errLogToConsole: true}).on('error', sass.logError))
      .pipe(sourcemaps.init())
      .pipe(autoprefixer(autoprefixerOptions))
      .pipe(cssmin())
      .pipe(rev())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(path.deployDir));
  }
});

gulp.task('indexTask', ['browserifyTask', 'cssTask'], function(){
  var target = gulp.src(path.buildDir + '/index.html');
  var sources = gulp.src([path.deployDir + '/*.js', path.deployDir + '/*.css'], {read: false});

  return target
    .pipe(inject(sources, {removeTags: true, cwd: __dirname + '/dist', ignorePath: '/dist', addRootSlash: false}))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(path.deployDir));
});

gulp.task('cleanTask', function(cb) {
  return del([path.deployDir], cb)
});

gulp.task('imagesTask', function() {
  return gulp.src(path.buildDir+'/images/**/*')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest(path.deployDir+'/images/'))
    .pipe(notify({ message: 'Images task complete' }));
});

// Starts our development workflow
gulp.task('default', function () {
  
  livereload.listen();
  development = true;

  gulp.start('browserifyTask', 'cssTask');

  connect.server({
    root: path.buildDir,
    port: 8889
  });

});

gulp.task('deploy', ['cleanTask'], function () {

  development = false;

  gulp.start('browserifyTask', 'cssTask', 'indexTask', 'imagesTask');

});

gulp.task('test', function () {
    return gulp.src('./build/testrunner-phantomjs.html').pipe(jasminePhantomJs());
});