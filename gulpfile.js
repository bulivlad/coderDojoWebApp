/**
 * Created by catap_000 on 9/7/2017.
 */

const gulp = require('gulp');
const sass = require('gulp-sass');
const exec = require('child_process').exec;

gulp.task('sass', function(){
    gulp.src('client/styles/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('client/styles/'));
});

gulp.task('start-server', function(callback){
   exec('node app.js',  function (err, stdout, stderr) {
       console.log(stdout);
       console.log(stderr);
       callback(err);
   });
});


gulp.task('start', ['sass', 'start-server']);
