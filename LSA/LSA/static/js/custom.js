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
$('#login-email').on('input', function () {
    const email = $(this).val();
    validateEmail(email,'login-email-error')
});


// Password validation
$('#login-password').on('input', function () {
    const password = $(this).val();
    validatePassword(password,'login-password-error');
});


function togglePasswordVisibility(toggleButtonId, passwordFieldId) {
    $(toggleButtonId).on('click', function () {
        const passwordField = $(passwordFieldId);
        const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', type);
        $(this).text(type === 'password' ? '🙈' : '👁️');
    });
}
togglePasswordVisibility('#login-toggle-password', '#login-password');

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


// Setup CSRF token
$.ajaxSetup({
    headers: { 'X-CSRFToken': csrftoken }
});

//signup.html
// Toggle password visibility
togglePasswordVisibility('#signup-toggle-password', '#signup-password');


// Username validation and availability check
$('#signup-username').on('input', function () {
    const username = $(this).val().trim();
    const errorElement = $('#signup-username-error');
    const suggestionElement = $('#signup-username-suggestion');


    if (!validateUsername(username)) {
        errorElement.text("Invalid username. Only letters, digits, @/./+/-/_ are allowed (max 20 characters).")
            .addClass('signup-error')
            .removeClass('signup-valid');
        suggestionElement.hide();
        return;
    }


    // Check username availability
    $.ajax({
        type: 'GET',
        url: checkusernameUrl,
        data: { username },
        success: function (response) {
            if (response.exists) {
                errorElement.text("Username already exists.")
                    .addClass('signup-error')
                    .removeClass('signup-valid');
                if (response.suggestion) {
                    suggestionElement.text("Suggested username: " + response.suggestion).show();
                }
            } else {
                errorElement.text("Username available.")
                    .addClass('signup-valid')
                    .removeClass('signup-error');
                suggestionElement.hide();
            }
        },
        error: function () {
            errorElement.text("Error checking username availability. Please try again.")
                .addClass('signup-error')
                .removeClass('signup-valid');
        }
    });
});

let isEmailValid = false; // Track email validity
// Email validation and availability check
$('#signup-email').on('input', function () {
    const email = $(this).val().trim();
    const errorElement = $('#signup-email-error');


    if (!validateEmail(email)) {
        errorElement.text("Invalid email address.")
            .addClass('signup-error')
            .removeClass('signup-valid');
        return;
    }


    $.ajax({
        type: 'GET',
        url: checkemailUrl,
        data: { email },
        success: function (response) {
            if (response.exists) {
                errorElement
                    .text("Email already exists. Choose another one.")
                    .addClass('signup-error')
                    .removeClass('signup-valid');
                isEmailValid = false; // Mark email as invalid
            } else {
                errorElement
                    .text("Email available.")
                    .addClass('signup-valid')
                    .removeClass('signup-error');
                isEmailValid = true; // Mark email as valid
            }
        },
        error: function () {
            errorElement
                .text("Error checking email. Please try again.")
                .addClass('signup-error')
                .removeClass('signup-valid');
            isEmailValid = false; // Treat as invalid on error
        }
    });
});


// Password validation
$('#signup-password').on('input', function () {
    const password = $(this).val();
    const errorElement = $('#signup-password-error');


    if (!validatePassword(password)) {
        errorElement.text("Password must be at least 8 characters, include letters, numbers, and a special character.")
            .addClass('signup-error')
            .removeClass('signup-valid');
    } else {
        errorElement.text("Valid password.")
            .addClass('signup-valid')
            .removeClass('signup-error');
    }
});


// Clear error message when correcting input
$('#signup-username, #signup-email, #signup-password').on('input', function() {
    $('#signup-form-error-message').text('').removeClass('signup-error'); 
});


// Form submission
$('#signup').on('submit', function (e) {
    e.preventDefault();


    // Validate before submitting the form
    const username = $('#signup-username').val().trim();
    const email = $('#signup-email').val().trim();
    const password = $('#signup-password').val();
   // Check if any field is invalid
   if (!validateUsername(username) || !validateEmail(email) || !validatePassword(password)) {
    $('#signup-form-error-message')
        .text('Please fix the errors before submitting.')
        .addClass('signup-error')
        .removeClass('signup-valid');
    return; // Prevent form submission if validation fails
}
if (!isEmailValid) {
        $('#signup-form-error-message')
            .text("Please fix the email validation errors before submitting.")
            .addClass('signup-error');
        return; // Stop form submission if email is invalid
    }


const formData = {
    username,
    email,
    password,
    profile: {
        newsletter: $('#signup-newsletter').is(':checked')
    }
};


$.ajax({
    type: "POST",
    url: registerUrl,
    data: JSON.stringify(formData),
    contentType: "application/json",
    success: function () {
        window.location.href = userloginUrl;
    },
    error: function (response) {
        const errorMessage = response.responseJSON?.detail || "An unexpected error occurred. Please try again later.";
        $('#signup-form-error-message')
            .text(errorMessage)
            .addClass('signup-error')
            .removeClass('signup-valid');
    }
});
});

//user_welcome_page.html

document.addEventListener("DOMContentLoaded", function() {

if (typeof kycStatusUrl !== "undefined") {
    checkKYCStatus();
}
});

function checkKYCStatus() {
    if (typeof kycStatusUrl === "undefined") {

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

function kycimage_validateFileSize() {
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

//admin -user_list_details.html
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

//admin -user_kyc_waiting_list_details.html

$(document).ready(function() {
    function refreshTable() {
        if (typeof userkycwaitinglistUrl === 'undefined') {
            //console.warn("userkycwaitinglistUrl is not defined.");
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
        //console.warn("userkycwaitinglistUrl is not defined.");
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

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("password-reset-form");
    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.getElementById("reset-email").value;
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
                    const messageDiv = document.getElementById("reset-feedback");
                    if (data.message) {
                        // Hide form and show success message
                        document.getElementById("password-reset-form-container").style.display = "none";
                        const emailSentContainer = document.getElementById("email-container");
                        emailSentContainer.style.display = "block";
                        document.getElementById("reset-user-email").textContent = email;
                    } else if (data.email) {
                        messageDiv.textContent = data.email[0]; // Display validation error
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

$(document).ready(function () {
    togglePasswordVisibility('#toggle-password1', '#password1');
    togglePasswordVisibility('#toggle-password2', '#password2');
});
  

   
    $(document).ready(function () {
        // Attach event listeners for live password validation
        $('#password1, #password2').on('input', function () {
            const password1 = $('#password1').val();
            const password2 = $('#password2').val();
    
            // Validate password1 and show message
            const isValid = validatePassword(password1, 'password1-validation');
           
    
            // Check if password2 matches password1
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
    
            // Validate password1
            const isValidPassword = validatePassword(password1, 'password1-validation');
          
            // Check if password1 and password2 match
            if (!isValidPassword || password1 !== password2) {
                if (password1 !== password2) {
                    $('#password2-validation').text('Passwords do not match.');
                }
                return; // Stop form submission if validation fails
            }
    
            // Send AJAX request
            $.ajax({
                url: `/api/password-reset-confirm/${uidb64}/${token}/`, // Use variables passed from the backend
                method: 'POST',
                contentType: 'application/json',
                headers: { 'X-CSRFToken': csrfToken },
                data: JSON.stringify({ new_password1: password1, new_password2: password2 }),
                success: function (data) {
                    console.log('Password reset successful:', data);
                    // Hide the form and display the success message
                    $('#form-container').hide();
                    $('#success-message').fadeIn(); // Smoothly show success message
                },
                error: function (xhr) {
                    console.error('Password reset error:', xhr);
                    // Show error message from backend response
                    const errorData = xhr.responseJSON;
                    $('#error-message').text(
                        errorData?.message || 'An error occurred. Please try again.'
                    );
                },
            });
        });
    });
    



// common function's
function validatePassword(password, errorElementId) {
    const specialCharacterPattern = /[!@#$%^&*(),.?":{}|<>]/;
    const numberPattern = /\d/g;
    const letterPattern = /[A-Za-z]/;
    const spacePattern = /\s/; // Pattern to detect spaces
    const digitCount = (password.match(numberPattern) || []).length;

    const errorElement = $('#' + errorElementId);

    if (password.length < 8) {
        errorElement.text('Your password must contain at least 8 characters.');
        return false;
    } else if (spacePattern.test(password)) {
        errorElement.text('Your password must not contain spaces.');
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
    errorElement.text('Valid password');
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

function togglePasswordVisibility(toggleButtonId, passwordFieldId) {
    $(toggleButtonId).on('click', function () {
        const passwordField = $(passwordFieldId);
        const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', type);
        $(this).text(type === 'password' ? '🙈' : '👁️');
    });
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
    


togglePasswordVisibility('#admin_signup_toggle_password', '#admin_signup_password_id');

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
   
    togglePasswordVisibility('#custom_admin_login_toggle_password', '#custom_admin_login_password_id');

    
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
                        <button class="lottery_events_add_edit_button" onclick="lottery_events_enableEditMode(this)">Edit</button>
                        <button class="lottery_events_add_save_button" onclick="lottery_events_edit_saveChanges(this)">Save</button>
                        <button class="lottery_events_add_cancel_button" onclick="lottery_events_cancelEdit(this)">Cancel</button>
                        <button class="lottery_events_add_delete_button" onclick="deleteLotteryEvent(${event.id})">Delete</button>
                    `;

                    container.appendChild(eventDiv);
                });
            })
            .catch(error => console.error('Error fetching events:', error));
    }

    // Enable edit mode for a specific lottery event card
    function lottery_events_enableEditMode(button) {
        const card = button.closest('.lottery-event-card');
        card.classList.add('lottery_events_add_edit_mode');
    }

    // Clear all error messages
    function lottery_events_edit_clearErrorMessages(card) {
        card.querySelectorAll('.lottery_events_add_error_message').forEach(error => {
            error.style.display = 'none';
        });
    }

    // Reset fields to their original values on cancel
    function lottery_events_edit_resetFields(card) {
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
    function lottery_events_cancelEdit(button) {
        const card = button.closest('.lottery-event-card');
        lottery_events_edit_resetFields(card); // Reset fields to original values
        lottery_events_edit_clearErrorMessages(card); // Clear error messages when canceling
        card.classList.remove('lottery_events_add_edit_mode'); // Exit edit mode
    }

    // Validate required fields and show error messages below each field
    function lottery_events_edit_validateFields(card) {
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
    function lottery_events_edit_saveChanges(button) {
        const card = button.closest('.lottery-event-card');

        // Validate required fields
        if (!lottery_events_edit_validateFields(card)) {
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
                lottery_events_edit_clearErrorMessages(card); // Clear errors after saving
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
    clear_lottery_events_add_inputs_errors();

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
            validate_lottery_events_add_inputs(data);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to clear previous validation error messages
function clear_lottery_events_add_inputs_errors() {
    document.getElementById('lottery_events_add_title_validation').textContent = '';
    document.getElementById('lottery_events_add_description_validation').textContent = '';
    document.getElementById('lottery_events_add_price_validation').textContent = '';
    document.getElementById('lottery_events_add_drawdate_validation').textContent = '';
    document.getElementById('lottery_events_add_image_validation').textContent = '';
    document.getElementById('lottery_events_add_isactive_validation').textContent = '';
    document.getElementById('lottery_events_add_totaltickets_validation').textContent = '';
}

// Function to show validation errors near each field
function validate_lottery_events_add_inputs(errors) {
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


function lottery_events_fetch() {
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
// Function to format the draw date
function lottery_events_formatDrawDate(drawDate) {
    const now = new Date();
    const drawDay = new Date(drawDate);


    // Calculate difference in days
    const diffTime = drawDay - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));


    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


    // If the draw date is within the next 7 days
    if (diffDays >= 0 && diffDays <= 6) {
        if (drawDay.toDateString() === now.toDateString()) {
            return `Draw today at ${drawDay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (drawDay.toDateString() === new Date(now.getTime() + 86400000).toDateString()) {
            return `Draw tomorrow at ${drawDay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            const dayOfWeek = daysOfWeek[drawDay.getDay()];
            return `Draw ${dayOfWeek} at ${drawDay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
    }


    // For dates beyond the next 7 days, show the exact date
    return `Draw on ${drawDay.toLocaleDateString()} at ${drawDay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}


// Function to display the lottery events
function displayLotteryEvents(events) {
    const container = document.getElementById('lottery_events_container');
    container.innerHTML = ''; // Clear the container before rendering


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
            drawDateString = lottery_events_formatDrawDate(event.draw_date); // Use the new function to format the draw date
        } else {
            drawDateString = "Inactive"; // Show "Inactive" if the event is not active
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
    lottery_events_fetch();
};


//finish