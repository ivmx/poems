exports.routes = function (map) {
    map.resources('users');
	map.resources('poems');
	
	map.root('poems#index');
    map.get('/register','users#register');
    map.post('/register','users#register2');
    map.get('/login','users#login');
    map.post('/login','users#authenticate');
    map.get('/logout', 'users#logout');
    map.get('/mypoems', 'poems#mypoems');
    map.get('/profile', 'users#profile');

    // Generic routes. Add all your routes below this line
    // feel free to remove generic routes
    map.all(':controller/:action');
    map.all(':controller/:action/:id');
};
