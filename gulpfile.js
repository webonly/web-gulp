var gulp=require('gulp'),
	jshint=require('gulp-jshint'),
	uglify=require('gulp-uglify'),
	watch=require('gulp-watch'),
	livereload = require('gulp-livereload'),
	less=require('gulp-less'),
	concat=require('gulp-concat');


/** 语法检查 + 合并压缩  **/
	gulp.task('minify',function(){
		gulp.src(['demo/*.js','!demo/voice.js'])
			.pipe(jshint())
			.pipe(jshint.reporter('default'))
			.pipe(concat('app.js'))
			.pipe(uglify())
			.pipe(gulp.dest('voice'));
	});


/**  自动编译less  **/
gulp.task('less', function () {
    // Endless stream mode 
    return watch('less/*.less', { ignoreInitial: false })
      .pipe(less())
      .pipe(gulp.dest('app/css'))
      .pipe(livereload());
});




// BrowserSync自动刷新 --files 路径是相对于运行该命令的项目（目录） 

//     browser-sync start --server --files "css/*.css, *.html"  

// 如果你的文件层级比较深，您可以考虑使用 **（表示任意目录）匹配，任意目录下任意.css 或 .html文件。 

//    //browser-sync start --server --files "**/*.css, **/*.html"   