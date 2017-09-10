/**
 * Created by Catalin Paraschiv on 9/7/2017.
 */

const gulp = require('gulp');
const sass = require('gulp-sass');
const exec = require('child_process').exec;
const uglify = require('gulp-uglify');
const minifyCss = require('gulp-minify-css');
const gutil = require('gulp-util');
const useref = require('gulp-useref');
const concat = require('gulp-concat');
const del = require('del');
const gulpif = require('gulp-if');


function minifyCssIfNeeded(){
    return process.env.NODE_ENV === 'production'
        ? minifyCss()
        : gutil.noop();
}

function minifyJsIfNeeded(){
    return process.env.NODE_ENV === 'production'
        ? uglify({mangle:false}).on('error', printErrorToConsole) // add this if errors occur to print to console
        : gutil.noop();
}

function concatIfNeeded(fileName){
    return process.env.NODE_ENV === 'production'
        ? concat(fileName)
        : gutil.noop();
}

function printErrorToConsole(err){
    gutil.log(gutil.colors.red('[Error]'), err.toString());
    this.emit('end');
}



//STYLE
gulp.task('empty-styles', function(){
    return del('client/styles/*', {force:true})
});

gulp.task('sass', ['empty-styles'], function(){
    return gulp.src('src/styles/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(minifyCssIfNeeded())
        .pipe(gulp.dest('client/styles/'))
});

gulp.task('copy-css', ['empty-styles'], function(){
    return gulp.src('src/styles/normalize.css')
        .pipe(minifyCssIfNeeded())
        .pipe(gulp.dest('client/styles'))
});

gulp.task('build-styles', ['empty-styles', 'copy-css', 'sass']);



//JAVASCRIPT
gulp.task('empty-vendor', function(){
    return del('client/vendor/*', {force:true});
});

gulp.task('copy-vendor', ['empty-vendor'],  function(){
    return gulp.src('src/vendor/*.*')
        .pipe(minifyJsIfNeeded())
        .pipe(gulp.dest('client/vendor/'));
});

gulp.task('empty-scripts', function(){
    return del('client/scripts/*', {force:true});
});

gulp.task('copy-js', ['empty-scripts'], function(){
    //We copy all js files (only for development).
    if(process.env.NODE_ENV !== 'production'){
        return gulp.src('src/scripts/**/*.js')
            .pipe(gulp.dest('client/scripts/'))
    } else {
        return;
    }

});

gulp.task('build-index.html-and-app.js', ['empty-scripts'], function(){
    // if the environment is production useref() takes all marked imports from the index.html and concatenates them into
    // one file (app.js) and removes the imports from index.html.
    if(process.env.NODE_ENV === 'production'){
        return gulp.src('src/index.html')
            .pipe(useref() )
            .pipe(gulpif('*.js', uglify({mangle:false})))
            .pipe(gulp.dest('client'));
    } else {
        //development (we copy the index.html from src to client
        return gulp.src('src/index.html')
            .pipe(gulp.dest('client'));
    }

});

gulp.task('build-js', ['copy-vendor', 'copy-js', 'build-index.html-and-app.js']);



//HTML
gulp.task('empty-directives', function(){
    return del('client/directives/*', {force:true});
});

gulp.task('copy-directives', ['empty-directives'], function(){
    return gulp.src('src/directives/*.*')
        .pipe(gulp.dest('client/directives'));
});

gulp.task('empty-views', function(){
    return del('client/views/*', {force:true});
});

gulp.task('copy-views', ['empty-views'], function(){
    return gulp.src('src/views/*.*')
        .pipe(gulp.dest('client/views'));
});

gulp.task('build-html', ['copy-directives', 'copy-views']);




//Build project
gulp.task('build-project', ['build-styles', 'build-html', 'build-js']);


//Start server
gulp.task('start-server', function(callback){
    exec('node app.js',  function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        callback(err);
    });
});

