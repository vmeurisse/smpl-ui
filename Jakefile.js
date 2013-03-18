var fs = require('fs');
var resolve = require('resolve');
var smplBuild = require('smpl-build-test');
var dir = {
	base: __dirname + '/'
};
dir.build = dir.base + 'build/';
dir.src = dir.base + 'client/';
dir.client = dir.build + 'client/';
dir.templates = dir.client + 'templates/';
dir.static = dir.build + 'static/'
dir.imgSrc = dir.clientSrc + 'img/'

jake.mkdirP(dir.build);
jake.mkdirP(dir.static);



task('default', ['compile', 'compile-templates'], function() {
	console.log('done Rly');
});

task('compile', ['require-js'], function() {
	console.log('compile-js');
	var requirejs = require('requirejs');
	
	var config = {
		baseUrl: dir.base,
		name: 'smpl-full',
		out: dir.base + 'smpl.js',
		//generateSourceMaps: true,
		optimize: 'none'
		//useSourceUrl: true,
		preserveLicenseComments: false,
		packages: [smplBuild.requireConfig('smpl', dir.base, require)]
	};
	
	console.log('Building', config.out);
	requirejs.optimize(config);
});

task('require-js', function() {
	console.log('require-js');
	var path = resolve.sync('requirejs/require', {basedir: dir.base});
	var txt =  fs.readFileSync(path, 'utf8');
	fs.writeFileSync(dir.base + 'require.js', txt, 'utf8');
});

task('compile-templates', [], function() {
	console.log('compile-templates');
	var list = new jake.FileList();
	list.include(dir.base + '/src/**/*.html');
	list = list.toArray();
	
	var smpl = require('smpl');
	for (var i = 0, l = list.length; i < l; i++) {
		var path = list[i];
		var txt = fs.readFileSync(path, 'utf8');
		var cssPath = path.substr(0, path.length - 5) + '.css';
		console.log(path, cssPath);
		if ((fs.existsSync || require('path').existsSync)(cssPath)) {
			txt = '<style>' + fs.readFileSync(cssPath, 'utf8') + '</style>' + txt;
		}
		var js = smpl.tpl.utils.precompile(txt);
		fs.writeFileSync(path + '.js', js, 'utf8');
	}
});