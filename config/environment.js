module.exports = function (compound) {

    var express = require('express'),
      MySQLSessionStore = require('connect-mysql-session')(express);
    var app = compound.app;

    app.configure(function(){
        app.use(compound.assetsCompiler.init());
        app.use(express.static(app.root + '/public', { maxAge: 86400000 }));
        app.set('jsDirectory', '/javascripts/');
        app.set('cssDirectory', '/stylesheets/');
        app.set('cssEngine', 'stylus');
        // make sure you run `npm install browserify uglify-js`
        //app.enable('clientside');
        app.use(express.bodyParser());
        app.use(express.cookieParser('secret'));
        app.use(express.session({
          secret: 'secret',
          store: new MySQLSessionStore("poems_db", "poems", "poems", {
            // options...
          })
        }));
        app.use(express.methodOverride());
        app.use(app.router);
    });

};
