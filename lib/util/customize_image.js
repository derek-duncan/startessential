//convert -background none -fill red -font MuseoSlab -size \
//        $(convert allergies-infographic.jpg -format "%[fx:.25*w]x" info:) \
//        label:"it works" miff:- | \
//        composite -geometry +222+1145 - allergies-infographic.jpg final.jpg

var gm = require('gm').subClass({imageMagick: true});
var async = require('async');
var overlayer = {
  link: function(stream, options, done) {
    async.waterfall([
      function(done) {
        options.x = options.x || 0;
        options.y = options.y || 0;
        options.text = options.text || '';
        options.color = options.color || '#DA4740';
        options.size = options.size || 25;

        gm(stream)
          .background('none')
          .fill(options.color)
          .font('MuseoSlab')
          .pointSize(options.size)
          .drawText(options.x, options.y, options.text)
          .stream(function(err, stdout, stderr) {
            return done(err, stdout)
          })
      }
    ], done)
  }
}

module.exports = overlayer;
