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

before(loadPoem, {
    only: ['show', 'edit', 'update', 'destroy']
    });

action('new', function () {
    this.title = 'Uusi runo';
    this.poem = new Poem;
    render();
});

action(function create() {
    Poem.create(req.body, function (err, poem) {
        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: poem && poem.errors || err});
                } else {
					User.findOne({where: {email: 'robo@tut.fi'}}, function (err, user) {
					  if ( !err && user ) {
						  poem.updateAttribute('userId', user.id, function () {
							send({code: 200, data: poem.toObject()});
						  });
					  }
					});
                }
            });
            format.html(function () {
                if (err) {
                    flash('error', 'Runon luonti epäonnistui');
                    render('new', {
                        poem: poem,
                        title: 'Uusi runo'
                    });
                } else {
					poem.updateAttribute('userId', req.session.user.id, function () {
						flash('info', 'Runo luotu');
						redirect(path_to.poems);
					});
                    
                }
            });
        });
    });
});

action(function index() {
    this.title = 'Runokirja';
    Poem.all({where: {published: true}, order: 'created DESC', limit: 10}, function (err, poems) {
		getAssociated(poems, 'author', false, 'poem', function(results) { // False bool says the model has one property
			switch (params.format) {
				case "json":
					send({code: 200, data: results});
					break;
				default:
					render({
						results: results
					});
			}
		});
    });
});

action(function mypoems() {
    this.title = 'Omat runot';
    Poem.all({where: {userId: req.session.user.id}, order: 'created DESC'}, function (err, poems) {
        switch (params.format) {
            case "json":
                send({code: 200, data: poems});
                break;
            default:
                render({
                    poems: poems
                });
        }
    });
});

action(function show() {
    this.title = this.poem.title;
    switch(params.format) {
        case "json":
            send({code: 200, data: this.poem});
            break;
        default:
            render();
    }
});

action(function edit() {
    this.title = 'Muokkaa runoa';
    switch(params.format) {
        case "json":
            send(this.poem);
            break;
        default:
            render();
    }
});

action(function update() {
    var poem = this.poem;
    this.title = 'Muokkaa runoa';
    this.poem.updateAttributes(req.body, function (err) {
        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: poem && poem.errors || err});
                } else {
                    send({code: 200, data: poem});
                }
            });
            format.html(function () {
                if (!err) {
                    flash('info', 'Runo päivitetty');
                    redirect(path_to.poem(poem));
                } else {
                    flash('error', 'Runon päivittäminen epäonnistui');
                    render('edit');
                }
            });
        });
    });
});

action(function destroy() {
    this.poem.destroy(function (error) {
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
                    flash('error', 'Runon poistaminen epäonnistui');
                } else {
                    flash('info', 'Runo on poistettu');
                }
                send("'" + path_to.poems + "'");
            });
        });
    });
});

function loadPoem() {
    Poem.find(params.id, function (err, poem) {
        if (err || !poem) {
            if (!err && !poem && params.format === 'json') {
                return send({code: 404, error: 'Not found'});
            }
            redirect(path_to.poems);
        } else {
            this.poem = poem;
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
