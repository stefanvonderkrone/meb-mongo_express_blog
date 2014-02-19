var hash = require('../libs/pass').hash;
var _db;
var _ = require("lodash");
var pageSize = 10;

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
                    return;
                } else if ( hash === user.hash ) {
                    console.log( "SUCCESSFULL!!!" );
                    fn( null, user );
                    return;
                }
                fn( new Error("Invalid password!") );
            } );
        }
    });
}

exports.getHome = function(req, res) {
    var blogposts = _db.get("blogposts");
    blogposts.find({},{}, function(error, posts) {
        res.render('bloglist', {
            blogPosts: _.map( posts.slice(0,10), function( post ) {
                return {
                    title: "The Title",
                    url: "/post/1",
                    thumbURL: "",
                    excerpt: "The Excerpt",
                    userName: "The Username",
                    postDate: (new Date()).toString(),
                    commentsCount: "0 Comments",
                    tags: _.map( post.tags, function( tag ) {
                        return {
                            tagName: "The Tagname",
                            tagURL: "/tag/The Tagname"
                        }
                    } )
                }
            } )
        });
    });
};

exports.getBackend = function(req, res) {
    res.locals.isOverview = true;
    res.render('backend');
};

exports.getCreateUser = function(req, res) {
    res.locals.isCreateUser = true;
    res.render('createuser');
};

exports.getNewPost = function(req, res) {
    res.locals.isNewPost = true;
    res.render('newpost');
};

exports.getUpdatePost = function(req, res) {
    res.locals.isUpdatePost = true;
    res.render('updatepost');
};

exports.getPosts = function(req, res) {
    res.redirect("/posts/0");
};

exports.getPostsAtPage = function(req, res) {
    var blogposts = _db.get("blogposts");
    var pageIndex = Math.max(0, parseInt(req.params.page_index, 10));
    blogposts.find({},{}, function(error, posts) {
        res.render('bloglist', {
            blogPosts: _.map(
                posts.slice(pageIndex * pageSize,pageIndex * pageSize + 10),
                function( post ) {
                    return {
                        title: "The Title",
                        url: "/post/1",
                        thumbURL: "",
                        excerpt: "The Excerpt",
                        userName: "The Username",
                        postDate: (new Date()).toString(),
                        commentsCount: "0 Comments",
                        tags: _.map( post.tags, function( tag ) {
                            return {
                                tagName: "The Tagname",
                                tagURL: "/tag/The Tagname"
                            }
                        } )
                    }
                }
            )
        });
    });
};

exports.getPost = function(req, res) {
    res.render('post');
};

exports.getTag = function(req, res) {
    res.render('bloglist');
};

exports.getLogin = function(req, res) {
    if ( !!req.session.user ) {
        res.redirect("/");
    } else {
        res.render('login');
    }
};

exports.getLogout = function(req, res) {
    req.session.destroy( function() {
        res.redirect("/");
    } );
};

exports.postCreateUser = function(req, res) {
    var email = req.body.email,
        pass0 = req.body.password,
        pass1 = req.body.password2;
    if ( pass0 !== pass1 ) {
        res.render( "createuser", {
            message: "Passwords don't match!"
        } );
    } else {
        var users = _db.get("users");
        users.findOne( { email: email }, function( error, user ) {
            if ( !!user ) {
                res.render( "createuser", {
                    message: "User already exists"
                } );
            } else {
                hash( pass0, function( error, salt, hash ) {
                    if ( !!error ) {
                        res.render( "createuser", {
                            message: "Couldn't add user! Sorry!"
                        } );
                    }
                    users.insert( {
                        email: email,
                        salt: salt,
                        hash: hash
                    }, function( error, doc ) {
                        if ( !!error ) {
                            res.render( "createuser", {
                                message: "Couldn't add user! Sorry!"
                            } );
                        }
                        res.render( "createuser", {
                            message: "User successfully created!"
                        } );
                    } )
                } );
            }
        } );
    }
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
                // req.session.save( function() {
                //     res.redirect("/");
                // } );
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