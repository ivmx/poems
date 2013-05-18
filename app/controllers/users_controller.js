load('application');

before(loadUserSession);

function loadUserSession () {
  if (req.session.user) {
    this.user_current = req.session.user;
  } else {
    this.user_current = null;
  }
  next();  
}

before(loadUser, {
    only: ['profile','show', 'edit', 'update', 'destroy']
    });

action('register', function () {
    this.title = 'Rekisteröidy';
    this.newuser = new User;
    render();
});

action('register2', function () {
    this.title = 'Rekisteröidy';
    var email = req.body.email;
    var password = req.body.password;
    var repassword = req.body.repassword;
    User.findOne({where: {email: email}}, function (err, user) {
      if (err || !user ) {
        if (!err && !user && params.format === 'json') {
            return send({code: 404, error: 'Not found'});
        }
        if (password != repassword) {
          flash('error', 'Salasanan uudelleenkirjoitusvirhe');
          redirect(path_to.register);
        }
        User.create({email: req.body.email, password: req.body.password}, function (err, user) {
          flash('info', 'Rekisteröityminen onnistui!');
          redirect(path_to.register);
        });
        
      } else {
        flash('error', 'Tämä sähköpostiosoite on jo rekisteröity!');
        render('register');
      }});
    
});

action('login', function () {
    this.title = 'Kirjaudu';
    render();
});

action('authenticate', function () {
    this.title = 'Kirjaudu';
    var email = req.body.email;
    var password = req.body.password;
    console.log(email);
    console.log(password);
    User.findOne({where: {email: email}}, function (err, user) {
      if (err || !user ) {
          if (!err && !user && params.format === 'json') {
              return send({code: 404, error: 'Not found'});
          }
          flash('error', 'User not found');
          redirect(path_to.login);
        } else if (password != user.password) {
          flash('error', 'Wrong password');
          redirect(path_to.login);
        } else {
          req.session.user = user;
          console.log(user);
          flash('info', 'Login success');
          Poem.all({where: {published: true}, order: 'created DESC', limit: 10}, function (err, poems) {
			getAssociated(poems, 'author', false, 'poem', function(results) { // False bool says the model has one property
				switch (params.format) {
					case "json":
						send({code: 200, data: poems});
						break;
					default:
						render('main',{
							user_current: req.session.user,
							results: results
						});
				}
			});
		  });
        }});
    
});

action('logout', function () {
    this.title = 'Kirjaudu ulos';
    req.session.destroy(function(){
	  Poem.all({where: {published: true}, order: 'created DESC', limit: 10}, function (err, poems) {
		getAssociated(poems, 'author', false, 'poem', function(results) { // False bool says the model has one property
			switch (params.format) {
				case "json":
					send({code: 200, data: poems});
					break;
				default:
					render('main',{
						user_current: null,
						results: results
					});
			}
		});
	  });
    });
});

action('profile', function () {
    this.title = 'User profile';
    switch(params.format) {
        case "json":
            send({code: 200, data: this.user});
            break;
        default:
            render('show');
    }
});

action('new', function () {
    this.title = 'New user';
    this.user = new User;
    render();
});

action(function create() {
    User.create(req.body.User, function (err, user) {
        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: user && user.errors || err});
                } else {
                    send({code: 200, data: user.toObject()});
                }
            });
            format.html(function () {
                if (err) {
                    flash('error', 'User can not be created');
                    render('new', {
                        user: user,
                        title: 'New user'
                    });
                } else {
                    flash('info', 'User created');
                    redirect(path_to.users);
                }
            });
        });
    });
});

action(function index() {
    this.title = 'Users index';
    User.all(function (err, users) {
        switch (params.format) {
            case "json":
                send({code: 200, data: users});
                break;
            default:
                render({
                    users: users
                });
        }
    });
});

action(function show() {
    this.title = 'User show';
    switch(params.format) {
        case "json":
            send({code: 200, data: this.user});
            break;
        default:
            render();
    }
});

action(function edit() {
    this.title = 'User edit';
    switch(params.format) {
        case "json":
            send(this.user);
            break;
        default:
            render();
    }
});

action(function update() {
    var user = this.user;
    this.title = 'Edit user details';
    this.user.updateAttributes(req.body, function (err) {
        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: user && user.errors || err});
                } else {
                    send({code: 200, data: user});
                }
            });
            format.html(function () {
                if (!err) {
                    flash('info', 'User updated');
                    redirect(path_to.user(user));
                } else {
                    flash('error', 'User can not be updated');
                    render('edit');
                }
            });
        });
    });
});

action(function destroy() {
    this.user.destroy(function (error) {
        respondTo(function (format) {
            format.json(function () {
                if (error) {
                    send({code: 500, error: error});
                } else {
                    send({code: 200});
                }
            });
            format.html(function () {
                if (error) {
                    flash('error', 'Can not destroy user');
                } else {
                    flash('info', 'User successfully removed');
                }
                send("'" + path_to.users + "'");
            });
        });
    });
});

function loadUser() {
    User.find(params.id, function (err, user) {
        if (err || !user) {
            if (!err && !user && params.format === 'json') {
                return send({code: 404, error: 'Not found'});
            }
            redirect(path_to.users);
        } else {
            this.user = user;
            next();
        }
    }.bind(this));
}

function getAssociated(models, assoc, multi, modelName, cb) {
    var results = [];
    
    function async(model, assoc, callback) {        
        model = (multi) ? model[modelName] : model;
        model[assoc](function (err, assoc) {
            callback(assoc);
        })
    }
    
    function series(model) {
        if (model) {
            async(model, assoc, function (result) {
                var obj = {};
                
                if (!multi) 
                    obj[modelName] = model;
                else
                    obj = model;
                    
                obj[String(assoc)] = result;
                results.push(obj);
                return series(models.shift());
            });
        } else {
            return cb(results);
        }
    }
    
    series(models.shift());
}
