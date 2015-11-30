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
var babelify = require('babelify');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
  'react',
  'react/addons'
];

var browserifyTask = function (options) {

  // Our app bundler
  var appBundler = browserify({
    entries: [options.src], // Only need initial file, browserify finds the rest
    transform: [reactify], // We want to convert JSX to normal javascript
    extensions: ['.js', '.jsx'],
    debug: options.development, // Gives us sourcemapping
    cache: {}, 
    packageCache: {}, 
    fullPaths: options.development // Requirement of watchify
  });

  // We set our dependencies as externals on our app bundler when developing    
  (options.development ? dependencies : []).forEach(function (dep) {
    appBundler.external(dep);
  });

  // The rebundle process
  var rebundle = function () {
    var start = Date.now();
    console.log('Building APP bundle');
    appBundler
      .transform(babelify, { presets: ['es2015'] })
      .bundle()
      .on('error', gutil.log)
      .pipe(source('main.js'))
      .pipe(gulpif(!options.development, streamify(uglify())))
      .pipe(gulp.dest(options.dest))
      .pipe(gulpif(options.development, livereload()))
      .pipe(notify(function () {
        console.log('APP bundle built in ' + (Date.now() - start) + 'ms');
      }));
  };

  // Fire up Watchify when developing
  if (options.development) {
    appBundler = watchify(appBundler);
    appBundler.on('update', rebundle);
  }
      
  rebundle();

  // We create a separate bundle for our dependencies as they
  // should not rebundle on file changes. This only happens when
  // we develop. When deploying the dependencies will be included 
  // in the application bundle
  if (options.development) {

    var testFiles = glob.sync('./specs/**/*-spec.js');
    var testBundler = browserify({
      entries: testFiles,
      debug: true, // Gives us sourcemapping
      extensions: ['.js', '.jsx'],
      transform: [reactify],
      cache: {}, 
      packageCache: {}, 
      fullPaths: true // Requirement of watchify
    });

    dependencies.forEach(function (dep) {
      testBundler.external(dep);
    });

    var rebundleTests = function () {
      var start = Date.now();
      console.log('Building TEST bundle');
      testBundler
        .transform(babelify, { presets: ['es2015'] })
        .bundle()
      .on('error', gutil.log)
        .pipe(source('specs.js'))
        .pipe(gulp.dest(options.dest))
        .pipe(livereload())
        .pipe(notify(function () {
          console.log('TEST bundle built in ' + (Date.now() - start) + 'ms');
        }));
    };

    testBundler = watchify(testBundler);
    testBundler.on('update', rebundleTests);
    rebundleTests();

    // Remove react-addons when deploying, as it is only for testing
    if (!options.development) {
      dependencies.splice(dependencies.indexOf('react-addons'), 1);
    }

    var vendorsBundler = browserify({
      debug: true,
      require: dependencies
    });
    
    // Run the vendor bundle
    var start = new Date();
    console.log('Building VENDORS bundle');
    vendorsBundler
      .transform(babelify, { presets: ['es2015'] })
      .bundle()
      .on('error', gutil.log)
      .pipe(source('vendors.js'))
      .pipe(gulpif(!options.development, streamify(uglify())))
      .pipe(gulp.dest(options.dest))
      .pipe(notify(function () {
        console.log('VENDORS bundle built in ' + (Date.now() - start) + 'ms');
      }));
    
  }
  
}

var sassTask = function(options) {
  var task = function(){
    var start = new Date();
    
    return gulp.src(options.src)
      .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: options.development ? 'nested': 'compressed',
        errLogToConsole: true
      }).on('error', sass.logError))
      .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
      }))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(options.dest))
      .pipe(livereload())
      .pipe(notify(function () {
        console.log('Sass built in ' + (Date.now() - start) + 'ms');
      }));
  }

  if(options.watch) {
    return gulp.watch('./sass/**/*.scss', task);
  } else {
    return task();
  }  
};

var config = {
  appEntryFile: './app/main.js',
  buildDir: './build',
  destDir: './dist',
  sassSrc: './sass/**/*.scss'
}

// Starts our development workflow
gulp.task('default', function () {
  livereload.listen();

  var development = true

  browserifyTask({
    development: development,
    src: config.appEntryFile,
    dest: config.buildDir
  });

  sassTask({
    watch: true,
    development: development,
    src: config.sassSrc,
    dest: config.buildDir
  });

  connect.server({
    root: config.buildDir,
    port: 8889
  });

});

gulp.task('deploy', function () {

  var development = false

  browserifyTask({
    development: development,
    src: config.appEntryFile,
    dest: config.destDir
  });
  
  sassTask({
    watch: false,
    development: development,
    src: config.sassSrc,
    dest: config.destDir
  });

});

gulp.task('test', function () {
    return gulp.src('./build/testrunner-phantomjs.html').pipe(jasminePhantomJs());
});