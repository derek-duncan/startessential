$(function() {
  var SE = window.SE || {};
  SE.phone = 520;
  SE.ipad = 768;
  SE.large = 1200;
  SE.colorShade = shadeColor(SE.color, -20) + ' !important';

  var drawTriangle = function(canvas, width, height, direction) {

    canvas.width = width;
    canvas.height = height;

    var context = canvas.getContext('2d');

    context.strokeStyle = '#E9E9E9';
    context.lineWidth = 3;

    context.beginPath();

    if (direction === 'inner') {

      context.moveTo(0, height);
      context.lineTo(width, 0);
      context.lineTo(width, height);
    }
    if (direction === 'outer') {

      context.moveTo(0, 0);
      context.lineTo(0, height);
      context.lineTo(width, height);
    }

    context.closePath();
    context.stroke();

    context.fillStyle = '#FAFAFA';
    context.fill();

  };

  var createArticleTriangles = function() {

    var triangles = $('.article-negative').find('.negative-triangle');

    triangles.each(function() {

      var self = this;
      var article = $(self).parents('.article');

      var percentOfArticle = 0.25;
      var triangleWidth = parseInt(article.outerWidth() * percentOfArticle, 10)
      var triangleHeight = parseInt(article.outerHeight(), 10);

      drawTriangle(self, triangleWidth, triangleHeight, 'inner');
    });
  };

  var createTourTriangles = function() {

    var triangles = $('.tour-negative').find('.negative-triangle');

    triangles.each(function() {

      var self = this;
      var article = $(self).parents('.tour');

      article.find('img').load(function() {

        var percentOfTour = 0.25;
        var triangleWidth = parseInt(article.outerWidth() * percentOfTour, 10)
        var triangleHeight = parseInt(article.outerHeight(), 10);

        drawTriangle(self, triangleWidth, triangleHeight, 'outer');
      });

    });
  };

  var setupMobileMenu = function() {

    var nav = $('.nav');
    var mobileIcon = nav.find('.nav-mobile-icon');
    var mobileList = nav.find('.nav-mobile-list');

    mobileIcon.on('click', function toggleMenu() {

      mobileList.toggleClass('open');
    });
  };

  var setCustomColor = function() {
    var SE = window.SE || {};
    SE.color = SE.color + ' !important';
    SE.colorAlt = SE.colorAlt + ' !important';

    changeCSS('.custom-bg', 'background-color', SE.color);
    changeCSS('.custom-bg-after:after', 'background-color', SE.color);
    changeCSS('.custom-bg-hover:hover', 'background-color', SE.color);
    changeCSS('.custom-bg-alt', 'background-color', SE.colorAlt);
    changeCSS('.custom-bg-alt-after:after', 'background-color', SE.colorAlt);
    changeCSS('.custom-bg-alt-hover:hover', 'background-color', SE.colorAlt);
    changeCSS('.custom-color', 'color', SE.color);
    changeCSS('.custom-border', 'border-color', SE.color);
    changeCSS('.custom-border-bottom', 'border-bottom-color', SE.color);
    changeCSS('.custom-border-alt', 'border-color', SE.colorAlt);
    changeCSS('.custom-border-hover:hover', 'border-color', SE.color);
    changeCSS('.custom-border-alt-hover:hover', 'border-color', SE.colorAlt);
  };

  var responsiveStyles = function() {

    var articleBanner = $('.article--banner');
    var bannerTitle = articleBanner.find('.article-title');

    var handleResize = function() {
      var wW = $(window).width();
      if (wW < SE.ipad) {
        bannerTitle.addClass('custom-color');
        bannerTitle.removeClass('custom-bg');
      } else {
        bannerTitle.removeClass('custom-color');
        bannerTitle.addClass('custom-bg');
      }
    };

    $(window).on('load resize', handleResize);
  };

  var openAnnouncement = function() {
    var handleClick = function(e) {

      var self = $(this);
      var activeClass = 'show custom-border-bottom custom-bg';

      if (self.hasClass('show') || self.hasClass('empty')) {

        $('.announcement').removeClass(activeClass);
        $('.announcement-insert').remove();
        return;
      }

      $('.announcement').removeClass(activeClass);
      self.toggleClass(activeClass);

      $('.announcement-insert').remove();

      var detailsText = self.find('.announcement-details').html();
      if (!detailsText.length) return;
      var details = $('<div />', {
        class: 'announcement-insert custom-bg',
        html: detailsText
      });

      var wW = $(window).width();
      var index = $('.announcement').index(self);
      if (index % 2 !== 0 || wW <= SE.ipad) {
        details.insertAfter(self);
      } else {
        details.insertAfter(self.next());
      }
    };

    var announcements = $('.announcement');
    announcements.each(function() {

      var self = $(this);
      if (!self.find('.announcement-details').text().length) {
        self.addClass('empty');
      } else {
        self.addClass('custom-bg-hover');
      }
    });
    changeCSS('.announcement.show', 'box-shadow', '0 3px 0 ' + SE.color);
    changeCSS('.announcement.show, .announcement-insert', 'border-top-color', SE.colorShade);
    announcements.on('click', handleClick);
  };

  var createTour = function() {

    var steps = $('.oil');
    var pager = $('.oils-previous, .oils-next');
    var previous = $('.oils-previous');
    var next = $('.oils-next');
    var signUp = $('.oils-signup')

    pager.on('click', function(e) {
      var self = $(this);
      var activeStep = parseInt($('.active').data('index'));

      if (self.hasClass('oils-previous')) {
        var prevStep = activeStep - 1;
        if (prevStep >= 0) {
          showStep(prevStep);
        }
      }
      if (self.hasClass('oils-next')) {
        var nextStep = activeStep + 1;
        if (nextStep <= steps.last().data('index')) {
          showStep(nextStep);
        }
      }
      if ((activeStep + 1) === (steps.length - 1)) {
        next.addClass('hide');
        signUp.addClass('show');
      } else {
        next.removeClass('hide');
        signUp.removeClass('show');
      }
    });

    function showStep(index) {
      var step = $('.oil[data-index='+index+']');
      steps.removeClass('active');
      step.addClass('active');
      $('.header-number').text(index + 1);
    }

    var setColor = function() {
      var self = $(this);
      var id = self.attr('id');
      var color = self.data('color');
      var selector = '#' + id + ' .oil-name:after';
      changeCSS(selector, 'background-color', color);
    }
    steps.each(setColor);
  };

  var init = function() {

    responsiveStyles();
    createArticleTriangles();
    createTourTriangles();
    setupMobileMenu();
    setCustomColor();
    openAnnouncement();
    createTour();
  };
  init();
});

function changeCSS(theClass,element,value) {

  var cssRules;
  for (var S = 0; S < document.styleSheets.length; ++S) {

    try {

      document.styleSheets[S].insertRule(theClass+' { '+element+': '+value+'; }', document.styleSheets[S]['cssRules'].length);
    } catch(err) {

      try {

        document.styleSheets[S].addRule(theClass,element+': '+value+';');
      } catch(err) {

        try {
          if (document.styleSheets[S]['rules']) {
            cssRules = 'rules';
          } else if (document.styleSheets[S]['cssRules']) {
            cssRules = 'cssRules';
          } else {
            return;
          }

          for (var R = 0; R < document.styleSheets[S][cssRules].length; R++) {

            if (document.styleSheets[S][cssRules][R].selectorText == theClass) {

              if(document.styleSheets[S][cssRules][R].style[element]){

                document.styleSheets[S][cssRules][R].style[element] = value;
                break;
              }
            }
          }
        } catch(err) {

          return;
        };
      }
    }
  }
}

function shadeColor(color, percent) {  
  var num = parseInt(color.slice(1),16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}
