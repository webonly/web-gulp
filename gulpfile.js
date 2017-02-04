 /**
  * gulp check                 语法检查js
  * gulp minify-js             合并+压缩js
  * gulp minify-jsonly	       仅压缩js
  * gulp less                  自动编译less
  * gulp minify-css            合并+压缩css
  * gulp minify-cssonly	       仅压缩css
  * gulp minify-html           仅压缩html
  *
  */

var gulp=require('gulp'),
	jshint=require('gulp-jshint'),
	concat=require('gulp-concat'),
	rename = require('gulp-rename'),
	uglify=require('gulp-uglify'),
	watch=require('gulp-watch'),
	livereload = require('gulp-livereload'),
	less=require('gulp-less'),
	cleanCSS = require('gulp-clean-css'),
	htmlmin = require('gulp-htmlmin');


 /** 语法检查  **/
	gulp.task('check',function(){
		gulp.src(['app/js/*.js'])
			.pipe(jshint())
			.pipe(jshint.reporter('default'));
	});
 /** 合并压缩JS  **/
	gulp.task('minify-js',function(){
		gulp.src(['app/js/*.js'])
			.pipe(concat('app.js'))         //合并所有js到app.js
			.pipe(gulp.dest('app/js'))      //输出app.js到文件夹
			.pipe(rename({suffix: '.min'})) //rename压缩后的文件名
			.pipe(uglify())                //压缩
			.pipe(gulp.dest('app/js'));
	});
 /** 仅压缩JS  **/
	gulp.task('minify-jsonly',function(){
		gulp.src(['app/js/*.js'])
			.pipe(uglify())                //压缩
			.pipe(rename({suffix: '.min'})) //rename压缩后的文件名
			.pipe(gulp.dest('app/js'));
	});

/**   自动编译less   **/
   gulp.task('less', function () {
      return watch('less/*.less', { ignoreInitial: false })
      		.pipe(less())
      		.pipe(gulp.dest('app/css'))
     		.pipe(livereload());
    });
/**   合并+压缩CSS   **/
	gulp.task('minify-css', function() {
 		 return gulp.src('app/css/*.css')
 		 	  .pipe(concat('style.css'))         //合并所有css到style.css
			 .pipe(gulp.dest('app/css'))         //输出app.js到文件夹
   			 .pipe(cleanCSS({compatibility: 'ie8'}))
   			 .pipe(rename({suffix: '.min'})) //rename压缩后的文件名
   			 .pipe(gulp.dest('app/css'));
    });
/**   仅压缩CSS   **/
	gulp.task('minify-cssonly', function() {
 		 return gulp.src('app/css/*.css')
   			 .pipe(cleanCSS({compatibility: 'ie8'}))
   			 .pipe(rename({suffix: '.min'})) //rename压缩后的文件名
   			 .pipe(gulp.dest('app/css'));
    });
/**   压缩html   **/
	gulp.task('minify-html', function() {
		return gulp.src('html/*.html')
   		    .pipe(htmlmin({collapseWhitespace: true}))
   		    .pipe(gulp.dest('app/templates'));
	});







// BrowserSync自动刷新 --files 路径是相对于运行该命令的项目（目录） 

//     browser-sync start --server --files "css/*.css, *.html"  

// 如果你的文件层级比较深，您可以考虑使用 **（表示任意目录）匹配，任意目录下任意.css 或 .html文件。 

//    //browser-sync start --server --files "**/*.css, **/*.html"   



