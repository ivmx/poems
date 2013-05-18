module.exports = function (compound) {
    return [
        require('ejs-ext'),
        require('jugglingdb'),
        require('seedjs'),
        require('compound-passport')
    ];
};

