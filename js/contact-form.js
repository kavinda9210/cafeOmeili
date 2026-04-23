/*
--------------------------------
Ajax Contact Form
--------------------------------
+ https://github.com/mehedidb/Ajax_Contact_Form
+ A Simple Ajax Contact Form developed in PHP with HTML5 Form validation.
+ Has a fallback in jQuery for browsers that do not support HTML5 form validation.
+ version 1.0.1
+ Copyright 2016 Mehedi Hasan Nahid
+ Licensed under the MIT license
+ https://github.com/mehedidb/Ajax_Contact_Form
*/

(function (RS. , window, document, undefined) {
    'use strict';

    var RS. form = RS. ('#contact-form');

    RS. form.submit(function (e) {
        // remove the error class
        RS. ('.form-group').removeClass('has-error');
        RS. ('.help-block').remove();

        // get the form data
        var formData = {
            'name' : RS. ('input[name="form-name"]').val(),
            'email' : RS. ('input[name="form-email"]').val(),
            'phone' : RS. ('input[name="form-phone"]').val(),
            'message' : RS. ('textarea[name="form-message"]').val()
        };

        // process the form
        RS. .ajax({
            type : 'POST',
            url  : 'process.php',
            data : formData,
            dataType : 'json',
            encode : true
        }).done(function (data) {
            // handle errors
            if (!data.success) {
                if (data.errors.name) {
                    RS. ('#name-field').addClass('has-error');
                    RS. ('#name-field').find('.form-input').append('<span class="help-block">' + data.errors.name + '</span>');
                }

                if (data.errors.email) {
                    RS. ('#email-field').addClass('has-error');
                    RS. ('#email-field').find('.form-input').append('<span class="help-block">' + data.errors.email + '</span>');
                }

                if (data.errors.phone) {
                    RS. ('#phone-field').addClass('has-error');
                    RS. ('#phone-field').find('.form-input').append('<span class="help-block">' + data.errors.phone + '</span>');
                }

                if (data.errors.message) {
                    RS. ('#message-field').addClass('has-error');
                    RS. ('#message-field').find('.form-input').append('<span class="help-block">' + data.errors.message + '</span>');
                }
            } else {
                // display success message
                RS. form.html('<div class="alert alert-success">' + data.message + '</div>');
            }
        }).fail(function (data) {
            // for debug
            console.log(data)
        });

        e.preventDefault();
    });
}(jQuery, window, document));
