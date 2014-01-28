var hash = require('../libs/pass').hash;
var _db;

exports._setDB = function(db) {
    _db = db;
};

function authenticate(email, pass, fn) {
    console.log("AUTHENTICATING %s:%s", email, pass);
    var users = _db.get("users");
    users.findOne({email: email}, function( error, user ) {
        console.log("USER:", user);
        if ( error || !user ) {
            fn( error );
        } else {
            hash( pass, user.salt, function( err, hash ) {
                if ( err ) {
                    fn( err );
                } else if ( hash === user.hash ) {
                    console.log( "SUCCESSFULL!!!" );
                    fn( null, user );
                }
                fn( new Error("Invalid password!") );
            } );
        }
    });
}

exports.getHome = function(req, res) {
  res.render('home');
};

exports.getBackend = function(req, res) {
    res.render('backend');
};

exports.getCreateUser = function(req, res) {
    res.render('createuser');
};

exports.getNewPost = function(req, res) {
    res.render('newpost');
};

exports.getUpdatePost = function(req, res) {
    res.render('updatepost');
};

exports.getPosts = function(req, res) {
    res.render('posts');
};

exports.getPostsAtPage = function(req, res) {
    res.render('postsatpage', {
        page: 1
    });
};

exports.getPost = function(req, res) {
    res.render('post');
};

exports.getLogin = function(req, res) {
    res.render('login');
};

exports.getLogout = function(req, res) {
    req.session.destroy( function() {
        res.redirect("/");
    } );
};

exports.postCreateUser = function(req, res) {

};

exports.postAddPost = function(req, res) {

};

exports.postUpdatePost = function(req, res) {

};

exports.postLogin = function(req, res) {
    authenticate( req.body.email, req.body.password, function( err, user ) {
        if ( user ) {
            console.log("REGENERATING SESSION");
            req.session.regenerate( function(error) {
                if ( error ) {
                    console.log("session-error:", error);
                }
                console.log("SETTING USER");
                req.session.user = user;
                req.session.success = "authenticated";
                console.log("THE SESSION:", req.session);
                console.log("THE SESSION_ID:", req.sessionID);
                res.redirect("/");
            } );
        } else {
            req.session.error = "access denied";
            res.redirect("/login");
        }
    } );
};