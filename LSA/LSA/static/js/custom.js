// Function to get CSRF token from cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

// Set up AJAX with CSRF token
$.ajaxSetup({
    headers: {
        'X-CSRFToken': csrftoken
    }
});
//login.html
$(document).ready(function () {
    // Email validation
    $('#login-email').on('input', function () {
        const email = $(this).val();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            $('#login-email-error').text('Please enter a valid email address.');
        } else {
            $('#login-email-error').text('');
        }
    });

    // Password validation
    $('#login-password').on('input', function () {
        const password = $(this).val();
        const passwordPattern = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (!passwordPattern.test(password)) {
            $('#login-password-error').text('Password must be at least 8 characters, contain a number, and a special character.');
        } else {
            $('#login-password-error').text('');
        }
    });

    // Toggle password visibility
    $('#login-toggle-password').on('click', function () {
        const passwordField = $('#login-password');
        const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', type);
        // Toggle icon text
        $(this).text(type === 'password' ? '🙈' : '👁️');
    });

    // Form submission
    $('#login-form').submit(function (e) {
        e.preventDefault();
        // Get the URL from the data attribute
        const loginUrl = $(this).data('url');
        const redirectUrl = $(this).data('redirect-url');
        // Clear previous login error message
        $('#login-error').text('');

        $.ajax({
            type: 'POST',
            url: loginUrl ,
            data: JSON.stringify({
                email: $('#login-email').val(),
                password: $('#login-password').val()
            }),
            contentType: 'application/json',
            success: function (response) {
                alert(response.message + ' (User ID: ' + response.user_id + ')');
                window.location.href = redirectUrl;
            },
            error: function () {
                // Displaying invalid email or password message
                $('#login-error').text('Invalid email or password.');
            }
        });
    });
});

//signup.html
$.ajaxSetup({ headers: { 'X-CSRFToken': csrftoken } });

// Toggle password visibility
$('#signup-toggle-password').on('click', function() {
    const passwordField = $('#signup-password');
    const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
    passwordField.attr('type', type);
    $(this).text(type === 'password' ? '🙈' : '👁️');
});

// Username validation
$('#signup-username').on('input', function() {
const username = $(this).val();
const usernamePattern = /^[a-zA-Z0-9@.+-_]{1,20}$/;
const noSpacesPattern = /^\S+$/; // Pattern to disallow spaces

if (!usernamePattern.test(username)) {
$('#signup-username-error')
    .text("Username must be 20 characters or fewer and contain only letters, digits, @/./+/-/_")
    .addClass('signup-error')
    .removeClass('signup-valid');
} else if (!noSpacesPattern.test(username)) {
$('#signup-username-error')
    .text("Username must not contain spaces")
    .addClass('signup-error')
    .removeClass('signup-valid');
} else {
$('#signup-username-error')
    .text("") // Clear the error message
    .removeClass('signup-error')
    .addClass('signup-valid');
}
});


// AJAX call for username availability
$('#signup-username').on('focusout', function() {
    const username = $(this).val();
    $.ajax({
        type: 'GET',
        url:checkusernameUrl ,
        data: { username: username },
        success: function(response) {
            if (response.exists) {
                $('#signup-username-error')
                    .text("Username already exists")
                    .addClass('signup-error')
                    .removeClass('signup-valid');
                if (response.suggestion) {
                    $('#signup-username-suggestion')
                        .text("Suggested username: " + response.suggestion)
                        .addClass('signup-suggestion')
                        .show();
                }
            } else {
                $('#signup-username-error')
                    .text("Username available.")
                    .addClass('signup-valid')
                    .removeClass('signup-error');
                $('#signup-username-suggestion').hide();
            }
        },
        error: function() {
            $('#signup-username-error')
                .text("Please enter a valid username.")
                .addClass('signup-error')
                .removeClass('signup-valid');
            $('#signup-username-suggestion').hide();
        }
    });
});


$('#signup-email').on('focusout', function() {
    const email = $(this).val().trim(); // Trim whitespace
    const emailError = $('#signup-email-error'); // Reference error display element

    // Validate if the email field is empty
    if (email === '') {
        emailError
            .text("Email field cannot be empty.")
            .addClass('signup-error')
            .removeClass('signup-valid');
        return; // Stop further execution
    }

    // Validate if the email is a valid Gmail address
    if (!email.endsWith('@gmail.com') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError
            .text("Enter a valid Gmail (e.g., example@gmail.com).")
            .addClass('signup-error')
            .removeClass('signup-valid');
        return; // Stop further execution
    }

    // Proceed to AJAX validation if input passes initial checks
    $.ajax({
        type: 'GET',
        url: checkemailUrl, // Replace with your actual URL
        data: { email: email },
        success: function(response) {
            if (response.exists) {
                emailError
                    .text("Email already exists, choose another one.")
                    .addClass('signup-error')
                    .removeClass('signup-valid');
            } else {
                emailError
                    .text("Email available.")
                    .addClass('signup-valid')
                    .removeClass('signup-error');
            }
        },
        error: function() {
            emailError
                .text("Error checking email, please try again.")
                .addClass('signup-error')
                .removeClass('signup-valid');
        }
    });
});


// Password validation function
function signupvalidatePassword(password) {
const specialCharacterPattern = /[!@#$%^&*(),.?":{}|<>]/;
const numberPattern = /\d/g;
const letterPattern = /[A-Za-z]/;
const digitCount = (password.match(numberPattern) || []).length;

let errorMessage = "";

if (password.length < 8) {
errorMessage = "Your password must contain at least 8 characters.";
} else if (!letterPattern.test(password)) {
errorMessage = "Your password must contain at least one letter.";
} else if (!specialCharacterPattern.test(password)) {
errorMessage = "Your password must contain at least one special character.";
} else if (digitCount < 4) {
errorMessage = "Your password must contain at least four numbers.";
}

return errorMessage;
}

// Handling password input
$('#signup-password').on('input', function() {
const password = $(this).val();
const errorMessage = signupvalidatePassword(password);

if (errorMessage) {
$('#signup-password-error')
    .text(errorMessage)
    .addClass('signup-error')
    .removeClass('signup-valid');
} else {
$('#signup-password-error')
    .text("Valid password")
    .addClass('signup-valid')
    .removeClass('signup-error');
}
});


// Form submission
$('#signup').on('submit', function(e) {
    e.preventDefault();
    const username = $('#signup-username').val();
const usernamePattern = /^[a-zA-Z0-9@.+-_]{1,20}$/;
const noSpacesPattern = /^\S+$/; // Pattern to disallow spaces

// Basic validation check for spaces in username before submitting
if (!usernamePattern.test(username) || !noSpacesPattern.test(username)) {
e.preventDefault(); // Prevent form submission
$('#signup-username-error')
    .text("Username must be 20 characters or fewer and contain only letters, digits, @/./+/-/_ and no spaces.")
    .addClass('signup-error')
    .removeClass('signup-valid');
return false;
}

    // Basic final validation
    if ($('.signup-error').length > 0) {
        $('#signup-form-error-message').text("Please fix the errors before submitting.");
        return;
    }

    $('#signup-form-error-message').text("");

    const formData = {
        username: $('#signup-username').val(),
        email: $('#signup-email').val(),
        password: $('#signup-password').val(),
        profile: {
            newsletter: $('#signup-newsletter').is(':checked')
        }
    };

    $.ajax({
        type: "POST",
        url: registerUrl,
        data: JSON.stringify(formData),
        contentType: "application/json",
        success: function(response) {
            alert(response.message + " Your user ID is " + response.user_id);
            
            window.location.href = userloginUrl;
        },
        error: function(response) {
            if (response.responseJSON) {
                alert('Error: ' + response.responseJSON.detail);
            } else {
                alert('An error occurred. Please try again.');
            }
        }
    });
});


// user_welcome_page.html.
document.addEventListener("DOMContentLoaded", function() {
//     checkKYCStatus();
// });
if (typeof kycStatusUrl !== "undefined") {
    checkKYCStatus();
}
});

function checkKYCStatus() {
    if (typeof kycStatusUrl === "undefined") {
        //console.warn("kycStatusUrl is not defined.");
        return;
    }
    fetch(kycStatusUrl, {
        method: "GET",
        headers: {
            "X-CSRFToken": csrfToken,
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error(data.error);
            return;
        }

        const kycModal = document.getElementById("kycModal");
        const skipButton = document.getElementById("skipButton");
        const okButton = document.getElementById("okButton");

        if (data.kyc_window_shown) {
            document.getElementById("kycModalTitle").textContent = data.kyc_title;
            document.getElementById("kycModalMessage").textContent = data.kyc_message;
            document.getElementById("kycUploadForm").style.display = 
                data.kyc_status === "verified" || data.kyc_status === "waiting" ? "none" : "block";
            
            if (data.kyc_status === "verified" || data.kyc_status === "waiting") {
                skipButton.style.display = "none";
                okButton.style.display = "inline-block";
            } else {
                skipButton.style.display = "inline-block";
                okButton.style.display = "none";
            }
            
            kycModal.style.display = "flex";
        }
    })
    .catch(error => console.error("Error fetching KYC status:", error));
}

function closeKYCModal() {
    document.getElementById("kycModal").style.display = "none";
}

function validateFileSize() {
    const errorMessageElement = document.getElementById("error-message");
    const imageFile = document.getElementById("kycImage").files[0];

    if (imageFile && imageFile.size > 500 * 1024) {
        errorMessageElement.textContent = "File size must be less than 500KB.";
    } else {
        errorMessageElement.textContent = ""; 
    }
}
document.addEventListener("DOMContentLoaded", function() {

const kycUploadForm = document.getElementById("kycUploadForm");
    if (kycUploadForm) {
        kycUploadForm.onsubmit = function(e) {
            e.preventDefault();
            const errorMessageElement = document.getElementById("error-message");
            const imageFile = document.getElementById("kycImage")?.files[0];

            if (imageFile && imageFile.size <= 500 * 1024) {
                const formData = new FormData();
                formData.append("image", imageFile);

                fetch(kycUploadUrl, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                    },
                    body: formData,
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === "success") {
                        alert("KYC image uploaded successfully.");
                        closeKYCModal();
                        if (typeof kycStatusUrl !== "undefined") {
                            checkKYCStatus();
                        }
                    } else if (data.image) {
                        errorMessageElement.textContent = data.image[0];
                    } else {
                        console.error("KYC upload error:", data);
                    }
                })
                .catch(error => console.error("Error uploading KYC image:", error));
            } else {
                errorMessageElement.textContent = "File size must be less than 500KB.";
            }
        };
    } else {
        
    }
});

// user_list_details.html.
$(document).ready(function() {
    if (typeof userlistUrl !== 'undefined' && userlistUrl) {
    // AJAX call to fetch user data
    $.ajax({
        url:userlistUrl,  // Ensure this URL matches the Django API endpoint
        type: 'GET',
        contentType: 'application/json',
        success: function(response) {
            // Check if we received data
            if (response.length > 0) {
                $('#user_list_table').show();
                response.forEach(user => {
                    let kycImageHTML = '';
                    if (user.kyc_image_url) {
                        // Use the dynamic link to view the image
                        kycImageHTML = `<a href="#" class="user_list_view_kyc_image" data-image-url="${user.kyc_image_url}" data-username="${user.user.username}" data-email="${user.user.email}" data-kycstatus="${user.kyc_status}">View KYC</a>`;
                    } else {
                        kycImageHTML = 'KYC not submitted';
                    }

                    $('#user_list_table tbody').append(`
                        <tr>
                            <td class="user_list_td">${user.user.id}</td>
                            <td class="user_list_td">${user.user.username}</td>
                            <td class="user_list_td">${user.user.email}</td>
                            <td class="user_list_td">${user.kyc_status.charAt(0).toUpperCase() + user.kyc_status.slice(1)}</td>
                            <td class="user_list_td">${kycImageHTML}</td>
                        </tr>
                    `);
                });
            } else {
                $('#user_list_message').text('No users found.').show();
            }
        },
        error: function(xhr, status, error) {
            $('#user_list_message').addClass('user_list_error').text("Error fetching user data: " + error).show();
        }
    });
} else {
       
    }

    // Modal behavior for viewing the KYC image
    $(document).on('click', '.user_list_view_kyc_image', function(event) {
        event.preventDefault();
        var imageUrl = $(this).data('image-url');
        var userName = $(this).data('username');
        var userEmail = $(this).data('email');
        var kycStatus = $(this).data('kycstatus');

        // Set user details and image source in modal
        $('#user_list_user_name').text(userName);
        $('#user_list_user_email').text(userEmail);
        $('#user_list_kyc_status').text(kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)); // Capitalize KYC status
        $('#user_list_kyc_image').attr('src', imageUrl);

        $('#user_list_kyc_modal').show(); // Show the modal
    });

    // Close button behavior
    $('.user_list_close_btn').on('click', function() {
        $('#user_list_kyc_modal').hide(); // Hide the modal when the close button is clicked
    });

    // Close the modal if clicked outside the modal content
    $(window).on('click', function(event) {
        if ($(event.target).is('#user_list_kyc_modal')) {
            $('#user_list_kyc_modal').hide();
        }
    });
});

// user_kyc_waiting_list_details.html.
$(document).ready(function() {
    function refreshTable() {
        if (typeof userkycwaitinglistUrl === 'undefined') {
            
            return; // Exit the function if the URL is not defined
        }
        $('#user_kyc_waiting_list-tbody').empty(); // Clear existing table rows
    
        $.ajax({
            url:userkycwaitinglistUrl,
            type: 'GET',
            contentType: 'application/json',
            success: function(response) {
                if (response.length > 0) {
                    $('#user_kyc_waiting_list-table').show();
                    response.forEach(user => {
                        let kycImageHTML = user.kyc_image_url
                            ? `<a href="#" class="user_kyc_waiting_list-view-kyc-image" data-image-url="${user.kyc_image_url}" data-username="${user.user.username}" data-email="${user.user.email}" data-kycstatus="${user.kyc_status}">View KYC</a>`
                            : 'KYC not submitted';

                        const kycOptions = `
                            <select class="user_kyc_waiting_list-kyc-status-select" data-user-id="${user.user.id}">
                                <option value="waiting" ${user.kyc_status === 'waiting' ? 'selected' : ''}>Waiting</option>
                                <option value="verified" ${user.kyc_status === 'verified' ? 'selected' : ''}>Verified</option>
                                <option value="rejected" ${user.kyc_status === 'rejected' ? 'selected' : ''}>Rejected</option>
                            </select>
                        `;

                        $('#user_kyc_waiting_list-tbody').append(`
                            <tr>
                                <td id="user_kyc_waiting_list-td">${user.user.id}</td>
                                <td id="user_kyc_waiting_list-td">${user.user.username}</td>
                                <td id="user_kyc_waiting_list-td">${user.user.email}</td>
                                <td id="user_kyc_waiting_list-td">${kycOptions}</td>
                                <td id="user_kyc_waiting_list-td">${kycImageHTML}</td>
                            </tr>
                        `);
                    });
                } else {
                    $('#user_kyc_waiting_list-message').text('No users found.').show();
                }
            },
            error: function(xhr, status, error) {
                $('#user_kyc_waiting_list-message').addClass('user_kyc_waiting_list-error').text("Error fetching user data: " + error).show();
            }
        });
    }

    //refreshTable();
     // Call refreshTable only if the URL is defined
     if (typeof userkycwaitinglistUrl !== 'undefined') {
        refreshTable();
    } else {
        
    }

    $(document).on('blur', '.user_kyc_waiting_list-kyc-status-select', function() {
        const userId = $(this).data('user-id');
        const newStatus = $(this).val();

        $.ajax({
            url:adminupdaetkycapprovalUrl ,
            type: 'POST',
            data: JSON.stringify({ user_id: userId, kyc_status: newStatus }),
            contentType: 'application/json',
            headers: { 'X-CSRFToken': csrfToken },
            success: function(response) {
                alert(`KYC status updated to ${newStatus}`);
                refreshTable();
            },
            error: function(xhr, status, error) {
                alert(`Failed to update KYC status: ${error}`);
            }
        });
    });

    $(document).on('click', '.user_kyc_waiting_list-view-kyc-image', function(event) {
        event.preventDefault();
        var imageUrl = $(this).data('image-url');
        var userName = $(this).data('username');
        var userEmail = $(this).data('email');
        var kycStatus = $(this).data('kycstatus');

        $('#user_kyc_waiting_list-userName').text(userName);
        $('#user_kyc_waiting_list-userEmail').text(userEmail);
        $('#user_kyc_waiting_list-kycStatus').text(kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1));
        $('#user_kyc_waiting_list-kycImage').attr('src', imageUrl);

        $('#user_kyc_waiting_list-kycModal').show();
    });

    $('.user_kyc_waiting_list-close-btn').on('click', function() {
        $('#user_kyc_waiting_list-kycModal').hide();
    });

    $(window).on('click', function(event) {
        if ($(event.target).is('#user_kyc_waiting_list-kycModal')) {
            $('#user_kyc_waiting_list-kycModal').hide();
        }
    });
});


function validatePassword(password, errorElementId) {
    const specialCharacterPattern = /[!@#$%^&*(),.?":{}|<>]/;
    const numberPattern = /\d/g;
    const letterPattern = /[A-Za-z]/;
    const digitCount = (password.match(numberPattern) || []).length;

    const errorElement = $('#' + errorElementId);

    if (password.length < 8) {
        errorElement.text('Your password must contain at least 8 characters.');
        return false;
    } else if (!letterPattern.test(password)) {
        errorElement.text('Your password must contain at least one letter.');
        return false;
    } else if (!specialCharacterPattern.test(password)) {
        errorElement.text('Your password must contain at least one special character.');
        return false;
    } else if (digitCount < 4) {
        errorElement.text('Your password must contain at least four numbers.');
        return false;
    }
    errorElement.text('Valid password').removeClass('admin_signup_error').addClass('admin_signup_valid');
    return true;
}

function validateUsername(username, errorElementId) {
    const errorElement = $('#' + errorElementId);
    if (username.length < 4) {
        errorElement.text('Username must be at least 4 characters.');
        return false;
    }
    errorElement.text('');
    return true;
}
  // Email validation function
function validateEmail(email, errorElementId) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const errorElement = $('#' + errorElementId);

    if (!emailPattern.test(email)) {
        errorElement.text('Please enter a valid email address.');
        return false;
    }
    errorElement.text('');
    return true;
}

// admin_signup.html
$(document).ready(function() {
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    const csrftoken = getCookie('csrftoken');
    
    $.ajaxSetup({
        headers: { 'X-CSRFToken': csrftoken }
    });

$('#admin_signup_username_id').on('blur', function() {
    const admin_username = $(this).val();
    if (!validateUsername(admin_username)) return;

    $.ajax({
        type: 'POST',
        url: adminapiAdminSignupUrl, // Replace with your actual API endpoint
        data: JSON.stringify({ 'admin_username': admin_username }),
        contentType: 'application/json',
        success: function(response) {
            $('#admin_signup_username_error').text('');
        },
        error: function(response) {
            const error = response.responseJSON.admin_username;
            $('#admin_signup_username_error').text(error ? error[0] : '');
        }
    });
});

$('#admin_signup_email_id').on('blur', function() {
    const admin_email = $(this).val();
    if (!validateEmail(admin_email)) return;

    $.ajax({
        type: 'POST',
        url: adminapiAdminSignupUrl, // Replace with your actual API endpoint
        data: JSON.stringify({ 'admin_email': admin_email }),
        contentType: 'application/json',
        success: function(response) {
            $('#admin_signup_email_error').text('');
        },
        error: function(response) {
            const error = response.responseJSON.admin_email;
            $('#admin_signup_email_error').text(error ? error[0] : '');
        }
    });
});



    $('#admin_signup_username_id').on('input', function() {
        validateUsername($(this).val(), 'admin_signup_username_error');
    });

    $('#admin_signup_email_id').on('input', function() {
        validateEmail($(this).val(), 'admin_signup_email_error');
    });

    $('#admin_signup_password_id').on('input', function () {
        validatePassword($(this).val(), 'admin_signup_password_error');
    });
    



$('#admin_signup_toggle_password').on('click', function() {
    const passwordField = $('#admin_signup_password_id');
    const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
    passwordField.attr('type', type);
    $(this).text(type === 'password' ? '🙈' : '👁️');
});

$('#admin_signup_form').submit(function(e) {
    e.preventDefault();
    const username = $('#admin_signup_username_id').val();
    const email = $('#admin_signup_email_id').val();
    const password = $('#admin_signup_password_id').val();

    if (validateUsername(username,'admin_signup_username_error') && validateEmail(email,'admin_signup_email_error') && validatePassword(password, 'admin_signup_password_error')) {
        $.ajax({
            type: 'POST',
            url: adminapiAdminSignupUrl, // Replace with your actual API endpoint
            data: JSON.stringify({ admin_username: username, admin_email: email, admin_password: password }),
            contentType: 'application/json',
            success: function(response) {
                window.location.href = adminapiAdminloginupUrl; // Replace with your actual login URL
            },
            error: function(response) {
                $('#admin_signup_username_error').text('');
                $('#admin_signup_email_error').text('');
                $('#admin_signup_password_error').text('');
                
                const errors = response.responseJSON;
                if (errors.admin_username) {
                    $('#admin_signup_username_error').text(errors.admin_username[0]);
                }
                if (errors.admin_email) {
                    $('#admin_signup_email_error').text(errors.admin_email[0]);
                }
            }
        });
    }
});
});


//custom_admin_login.html
$(document).ready(function() {
    // Function to get CSRF token from cookie
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    const csrftoken = getCookie('csrftoken');
    
    // Set up AJAX with CSRF token
    $.ajaxSetup({
        headers: {
            'X-CSRFToken': csrftoken
        }
    });
    
    
    // Toggle password visibility
    $('#custom_admin_login_toggle_password').on('click', function() {
        const passwordField = $('#custom_admin_login_password_id');
        const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', type);
        $(this).text(type === 'password' ? '🙈' : '👁️');
    });
    
    $(document).ready(function() {
        $('#custom_admin_login_email_id').on('input', function() {
            validateEmail($(this).val(), 'custom_admin_login_email_error');
        });
        $('#custom_admin_login_password_id').on('input', function () {
            validatePassword($(this).val(), 'custom_admin_login_password_error');
        });
    
        // Form submission with AJAX
        $('#custom_admin_login_form').submit(function(e) {
            e.preventDefault();
            const admin_email = $('#custom_admin_login_email_id').val();
            const admin_password = $('#custom_admin_login_password_id').val();
            if (validateEmail(admin_email,'custom_admin_login_email_error') && validatePassword(admin_password,'custom_admin_login_password_error')) {
                
    
                $.ajax({
                    type: 'POST',
                    url: api_admin_login_url,
                    data: JSON.stringify({ admin_email, admin_password }),
                    contentType: 'application/json',
                    success: function(response) {
                        if (response.success) {
                            $('#custom_admin_login_errorMessage').text('');
                            //alert('Login successful');
                            window.location.href = custom_admin_dashboard_url;
                        } else {
                            $('#custom_admin_login_errorMessage').text(response.message);
                        }
                    },
                    error: function(xhr) {
                        const response = xhr.responseJSON;
                        $('#custom_admin_login_errorMessage').text(response && response.message ? response.message : 'Incorrect email or password.');
                    }
                });
            }
        });
    });
    });


//lottery_events_add.html

    // Fetch and render lottery events
    function fetchLotteryEvents() {
        fetch(api_get_lottery_events_url)
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('lottery-events-container');
                container.innerHTML = '';  // Clear existing events

                data.forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.classList.add('lottery-event-card');
                    eventDiv.dataset.id = event.id;

                    eventDiv.innerHTML = `
                        <h3>
                            <span class="lottery_events_add_title">${event.title}</span>
                            <input type="text" class="lottery_events_add_edit_title" value="${event.title}" data-original-value="${event.title}" required>
                            <div class="lottery_events_add_error_message lottery_edit_title_error">Title is required</div>
                        </h3>
                        <p>
                            <span class="lottery_events_add_description">${event.description}</span>
                            <textarea class="lottery_events_add_edit_description" data-original-value="${event.description}" required>${event.description}</textarea>
                            <div class="lottery_events_add_error_message lottery_edit_description_error">Description is required</div>
                        </p>
                        <p>
                            Price: <span class="lottery_events_add_price">£${event.price}</span>
                            <input type="number" class="lottery_events_add_edit_price" value="${event.price}" data-original-value="${event.price}" required>
                            <div class="lottery_events_add_error_message lottery_edit_price_error">Price is required</div>
                        </p>
                        <p>
                            Draw Date: <span class="lottery_events_add_draw_date">${event.draw_date}</span>
                            <input type="datetime-local" class="lottery_events_add_edit_draw_date" value="${new Date(event.draw_date).toISOString().slice(0, 16)}" data-original-value="${new Date(event.draw_date).toISOString().slice(0, 16)}" required>
                            <div class="lottery_events_add_error_message lottery_edit_draw_date_error">Draw Date is required</div>
                        </p>
                        <p>
                            Status: <span class="lottery_events_add_is_active">${event.is_active ? 'Active' : 'Inactive'}</span>
                            <input type="checkbox" class="lottery_events_add_edit_is_active" ${event.is_active ? 'checked' : ''} data-original-checked="${event.is_active}">
                        </p>
                        <p>
                            Total Tickets: <span class="lottery_events_add_total_tickets">${event.total_tickets}</span>
                            <input type="number" class="lottery_events_add_edit_total_tickets" value="${event.total_tickets}" data-original-value="${event.total_tickets}" required>
                            <div class="lottery_events_add_error_message lottery_edit_total_tickets_error">Total Tickets are required</div>
                        </p>
                        ${event.image ? `<img src="${event.image}" alt="${event.title}" class="lottery_events_add_current_image"/>` : ''}
                        <input type="file" class="lottery_events_add_edit_image" accept="image/*">
                        <button class="lottery_events_add_edit_button" onclick="enableEditMode(this)">Edit</button>
                        <button class="lottery_events_add_save_button" onclick="saveChanges(this)">Save</button>
                        <button class="lottery_events_add_cancel_button" onclick="cancelEdit(this)">Cancel</button>
                        <button class="lottery_events_add_delete_button" onclick="deleteLotteryEvent(${event.id})">Delete</button>
                    `;

                    container.appendChild(eventDiv);
                });
            })
            .catch(error => console.error('Error fetching events:', error));
    }

    // Enable edit mode for a specific lottery event card
    function enableEditMode(button) {
        const card = button.closest('.lottery-event-card');
        card.classList.add('lottery_events_add_edit_mode');
    }

    // Clear all error messages
    function clearErrorMessages(card) {
        card.querySelectorAll('.lottery_events_add_error_message').forEach(error => {
            error.style.display = 'none';
        });
    }

    // Reset fields to their original values on cancel
    function resetFields(card) {
        card.querySelectorAll('.lottery_events_add_edit_title[type="text"], .lottery_events_add_edit_price[type="number"],.lottery_events_add_edit_total_tickets[type="number"], .lottery_events_add_edit_draw_date[type="datetime-local"], textarea').forEach(input => {
            input.value = input.getAttribute('data-original-value');
        });
        // Reset checkbox to its original state
        const checkbox = card.querySelector('.lottery_events_add_edit_is_active');
        if (checkbox) {
            checkbox.checked = checkbox.getAttribute('data-original-checked') === 'true';
        }
    }

    // Cancel edit mode and revert to initial state
    function cancelEdit(button) {
        const card = button.closest('.lottery-event-card');
        resetFields(card); // Reset fields to original values
        clearErrorMessages(card); // Clear error messages when canceling
        card.classList.remove('lottery_events_add_edit_mode'); // Exit edit mode
    }

    // Validate required fields and show error messages below each field
    function validateFields(card) {
        let isValid = true;

        const title = card.querySelector('.lottery_events_add_edit_title').value.trim();
        const description = card.querySelector('.lottery_events_add_edit_description').value.trim();
        const price = card.querySelector('.lottery_events_add_edit_price').value.trim();
        const drawDate = card.querySelector('.lottery_events_add_edit_draw_date').value.trim();
        const totalTickets = card.querySelector('.lottery_events_add_edit_total_tickets').value.trim();

        // Display specific error messages if fields are empty
        if (!title) {
            card.querySelector('.lottery_edit_title_error').style.display = 'block';
            isValid = false;
             // Scroll to the error message
             card.querySelector('.lottery_edit_title_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_title_error').style.display = 'none';
        }

        if (!description) {
            card.querySelector('.lottery_edit_description_error').style.display = 'block';
            isValid = false;
            // Scroll to the error message
            card.querySelector('.lottery_edit_description_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_description_error').style.display = 'none';
        }

        if (!price) {
            card.querySelector('.lottery_edit_price_error').style.display = 'block';
            isValid = false;
             // Scroll to the error message
             card.querySelector('.lottery_edit_price_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_price_error').style.display = 'none';
        }

        if (!drawDate) {
            card.querySelector('.lottery_edit_draw_date_error').style.display = 'block';
            isValid = false;
             // Scroll to the error message
             card.querySelector('.lottery_edit_draw_date_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_draw_date_error').style.display = 'none';
        }

        if (!totalTickets) {
            card.querySelector('.lottery_edit_total_tickets_error').style.display = 'block';
            isValid = false;
             // Scroll to the error message
             card.querySelector('.lottery_edit_total_tickets_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_total_tickets_error').style.display = 'none';
        }

        return isValid;
    }

    // Save changes made to a lottery event
    function saveChanges(button) {
        const card = button.closest('.lottery-event-card');

        // Validate required fields
        if (!validateFields(card)) {
            return;
        }

        const id = card.dataset.id;
        const title = card.querySelector('.lottery_events_add_edit_title').value;
        const description = card.querySelector('.lottery_events_add_edit_description').value;
        const price = card.querySelector('.lottery_events_add_edit_price').value;
        const drawDate = card.querySelector('.lottery_events_add_edit_draw_date').value;
        const isActive = card.querySelector('.lottery_events_add_edit_is_active').checked;
        const totalTickets = card.querySelector('.lottery_events_add_edit_total_tickets').value;
        const imageFile = card.querySelector('.lottery_events_add_edit_image').files[0];

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('draw_date', drawDate);
        formData.append('is_active', isActive);
        formData.append('total_tickets', totalTickets);
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        const url = apiEditDeleteLotteryEventsUrl.replace('0', id);

            fetch(url, {
            method: 'PUT',
            headers: {
                'X-CSRFToken':lottery_events_add_csrftoken,
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.id) {
                // Update card fields with new values
                card.querySelector('.lottery_events_add_title').textContent = title;
                card.querySelector('.lottery_events_add_description').textContent = description;
                card.querySelector('.lottery_events_add_price').textContent = `£${price}`;
                card.querySelector('.lottery_events_add_draw_date').textContent = drawDate;
                card.querySelector('.lottery_events_add_is_active').textContent = isActive ? 'Active' : 'Inactive';
                card.querySelector('.lottery_events_add_total_tickets').textContent = totalTickets;

                // Update image preview if a new one was uploaded
                if (data.image && card.querySelector('.lottery_events_add_current_image')) {
                    card.querySelector('.lottery_events_add_current_image').src = data.image;
                } else if (data.image) {
                    const imgElement = document.createElement('img');
                    imgElement.src = data.image;
                    imgElement.className = 'lottery_events_add_current_image';
                    card.insertBefore(imgElement, card.querySelector('.lottery_events_add_edit_image'));
                }

                // Exit edit mode
                card.classList.remove('lottery_events_add_edit_mode');
                clearErrorMessages(card); // Clear errors after saving
                alert('Lottery Event Updated Successfully');
            } else {
                alert('Error updating event');
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Delete a lottery event
    function deleteLotteryEvent(id) {
        if (confirm('Are you sure you want to delete this event?')) {
            const url = apiEditDeleteLotteryEventsUrl.replace('0', id);

            fetch(url, {    
        
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': lottery_events_add_csrftoken,
                }
            })
            .then(response => {
                if (response.ok) {
                    alert('Lottery Event Deleted Successfully');
                    fetchLotteryEvents(); // Reload events
                } else {
                    alert('Error deleting event');
                }
            })
            .catch(error => console.error('Error:', error));
        }
    }

    // Fetch events when the page loads
    window.onload = function() {
        fetchLotteryEvents();
    };
    // Add new lottery event
function submitAddLotteryEvent() {
    // Clear any previous validation errors
    clearValidationErrors();

    let form = document.getElementById('addLotteryEventForm');
    let formData = new FormData(form);

    fetch(api_lottery_events_add_url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': lottery_events_add_csrftoken,
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            alert('Lottery Event Added Successfully');
            fetchLotteryEvents();  // Reload the events after adding
            form.reset();  // Clear the form
        } else {
            // Display validation errors
            showValidationErrors(data);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to clear previous validation error messages
function clearValidationErrors() {
    document.getElementById('lottery_events_add_title_validation').textContent = '';
    document.getElementById('lottery_events_add_description_validation').textContent = '';
    document.getElementById('lottery_events_add_price_validation').textContent = '';
    document.getElementById('lottery_events_add_drawdate_validation').textContent = '';
    document.getElementById('lottery_events_add_image_validation').textContent = '';
    document.getElementById('lottery_events_add_isactive_validation').textContent = '';
    document.getElementById('lottery_events_add_totaltickets_validation').textContent = '';
}

// Function to show validation errors near each field
function showValidationErrors(errors) {
    if (errors.title) document.getElementById('lottery_events_add_title_validation').textContent = errors.title.join(', ');
    if (errors.description) document.getElementById('lottery_events_add_description_validation').textContent = errors.description.join(', ');
    if (errors.price) document.getElementById('lottery_events_add_price_validation').textContent = errors.price.join(', ');
    if (errors.draw_date) document.getElementById('lottery_events_add_drawdate_validation').textContent = errors.draw_date.join(', ');
    if (errors.image) document.getElementById('lottery_events_add_image_validation').textContent = errors.image.join(', ');
    if (errors.is_active) document.getElementById('lottery_events_add_isactive_validation').textContent = errors.is_active.join(', ');
    if (errors.total_tickets) document.getElementById('lottery_events_add_totaltickets_validation').textContent = errors.total_tickets.join(', ');
}


//lottery_events.html

// Function to fetch lottery events data from the API

function lottery_events_fetchLotteryEvents() {
    try {
        if (!api_get_lottery_events_url) {
            return; // Exit the function
        }

        fetch(api_get_lottery_events_url)
            .then(response => response.json())
            .then(data => {
                displayLotteryEvents(data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    } catch (error) {
    }
}


// Function to display the lottery events
function displayLotteryEvents(events) {
    const container = document.getElementById('lottery_events_container');
    container.innerHTML = '';  // Clear the container before rendering

    // Check if events data is available
    if (events.length === 0) {
        container.innerHTML = '<p>No lottery events available.</p>';
        return;
    }

    // Loop through the events and display them
    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.classList.add('lottery_events_event');

        
       
        let drawDateString = '';
        if (event.is_active) {
            const drawDate = new Date(event.draw_date);
            const drawTimeString = drawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            drawDateString = `Draw ${drawDate.toLocaleDateString()} ${drawTimeString}`;
        } else {
            drawDateString = "Inactive";  // Show "Inactive" if the event is not active
        }

        eventElement.innerHTML = `
            <div class="lottery_events_event_header">${drawDateString}</div>
            ${event.image ? `<img src="${event.image}" alt="${event.title}" />` : ''}
            <h3>${event.title}</h3>
            <p><strong>Description:</strong> ${event.description}</p>
            <div class="lottery_events_price">£${event.price}</div>
            <div class="lottery_events_sold_percentage">
                <div class="lottery_events_sold_bar" style="width: ${event.sold_percentage}%"></div>
            </div>
            <p>SOLD: ${event.sold_percentage}%</p>
            <a href="#" class="lottery_events_enter_button">Enter now</a>
        `;

        container.appendChild(eventElement);
    });
}

// Call the function to fetch and display lottery events when the page loads
window.onload = function() {
    lottery_events_fetchLotteryEvents();
};

//finish


// password_rest.html.
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("password-reset-request-form");
    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.getElementById("password-reset-email").value;
            const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;

            fetch("/api/password-reset/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
                body: JSON.stringify({ email: email }),
            })
                .then((response) => response.json())
                .then((data) => {
                    const messageDiv = document.getElementById("password-reset-feedback-message");
                    if (data.message) {
                        messageDiv.textContent = data.message;
                        messageDiv.style.color = "green";
                    } else if (data.email) {
                        messageDiv.textContent = data.email[0];
                        messageDiv.style.color = "red";
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                    alert("An error occurred. Please try again.");
                });
        });
    }
});

// password_rest_confirm.html.
// Password reset logic and UI interactions
$(document).ready(function () {
    // Toggle password visibility
    $('.confirm-toggle-icon').on('click', function () {
        const targetId = $(this).data('target');
        const passwordField = $('#' + targetId);
        const type = passwordField.attr('type') === 'password' ? 'text' : 'password';

        passwordField.attr('type', type);
        $(this).text(type === 'password' ? '🙈' : '👁️');
    });

    // Password validation function
    function validatePassword(password) {
        const specialCharacterPattern = /[!@#$%^&*(),.?":{}|<>]/;
        const numberPattern = /\d/g;
        const minLength = 8;

        if (password.length < minLength) return "Password must be at least 8 characters.";
        if (!specialCharacterPattern.test(password)) return "Password must contain a special character.";
        const numbers = password.match(numberPattern);
        if (!numbers || numbers.length < 4) return "Password must contain at least four numbers.";
        return ""; // Valid password
    }

    // Password validation messages
    $('#password1, #password2').on('input', function () {
        const password1 = $('#password1').val();
        const password2 = $('#password2').val();

        const validationMessage = validatePassword(password1);
        $('#password1-validation').text(validationMessage);

        if (password2 && password1 !== password2) {
            $('#password2-validation').text("Passwords do not match.");
        } else {
            $('#password2-validation').text("");
        }
    });

    // Handle form submission for resetting password
    $('#reset-password-form').on('submit', function (e) {
        e.preventDefault(); // Prevent default form submission

        const password1 = $('#password1').val();
        const password2 = $('#password2').val();

        // Clear previous messages
        $('#error-message').text('');
        $('#password1-validation').text('');
        $('#password2-validation').text('');

        // Validate passwords
        if (password1.length < 8) {
            $('#password1-validation').text('Password must be at least 8 characters long.');
            return;
        }
        if (password1 !== password2) {
            $('#password2-validation').text('Passwords do not match.');
            return;
        }

        // Send AJAX request
        $.ajax({
            url: `/api/password-reset-confirm/${uidb64}/${token}/`, // Use variables passed from the backend
            method: 'POST',
            contentType: 'application/json',
            headers: { 'X-CSRFToken': csrfToken },
            data: JSON.stringify({ new_password1: password1, new_password2: password2 }),
            success: function (data) {
                // Hide the form and display the success message
                $('#form-container').hide();
                $('#success-message').fadeIn(); // Smoothly show success message
            },
            error: function (xhr) {
                // Show error message from backend response
                const errorData = xhr.responseJSON;
                $('#error-message').text(
                    errorData?.message || 'An error occurred. Please try again.'
                );
            },
        });
    });
});
