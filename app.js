
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var exphbs = require('express3-handlebars');
var hash = require("./libs/pass").hash;
// mongodb
var mongo = require("mongodb");
var monk = require("monk");

var app = express();
var db = monk("localhost:27017/meb");

/**
 * let the routes-module have access to the database
 **/
routes._setDB(db);

/**
 * Setting up the html-rendering engine
 **/
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

// app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.bodyParser());
app.use(express.cookieParser('meb-secret-key'));
app.use(express.session());

/**
 * middleware to check, wether current user is logged in or not
 **/
app.use(function(req, res, next){
  var err = req.session.error
    , msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  res.locals.loggedIn = !!req.session.user;
  next();
});

function requireAuthentication(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

/**
 * all requests to /backend* require authentication
 **/
app.all('/backend*', requireAuthentication);

/**
 * GET-Routes
 **/
app.get('/', routes.getHome);
app.get('/backend', routes.getBackend );
app.get('/backend/createuser', routes.getCreateUser);
app.get('/backend/newpost', routes.getNewPost );
app.get('/backend/updatepost/:post_id', routes.getUpdatePost);
app.get('/posts', routes.getPosts);
app.get('/posts/:page_index', routes.getPostsAtPage);
app.get('/post/:post_id', routes.getPost );
app.get('/tag/:tag_name', routes.getTag);
app.get('/login', routes.getLogin);
app.get('/logout', routes.getLogout);

/**
 * POST-Routes
 **/
app.post('/backend/createuser', routes.postCreateUser);
app.post('/backend/addpost', routes.postAddPost );
app.post('/backend/updatedpost', routes.postUpdatePost);
app.post('/login', routes.postLogin);

/**
 * checks and inserts admin-user to db
 **/
(function requireAdmin() {
    var users = db.get("users");
    users.findOne( {email: "stefanvonderkrone@gmx.de"}, function( error, user ) {
        if ( error || !user ) {
            hash( "admin", function( error, salt, hash ) {
                if ( error ) {
                    throw error;
                }
                users.insert( {
                    email: "stefanvonderkrone@gmx.de",
                    salt: salt,
                    hash: hash
                }, function( error, doc ) {
                    if ( error ) {
                        throw error;
                    }
                    console.log( "added admin to db" );
                } );
            } );
        } else {
            console.log( "found admin in db" );
        }
    } );
}());

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
