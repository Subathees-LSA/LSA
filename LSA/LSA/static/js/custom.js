document.addEventListener("DOMContentLoaded", () => {
    const messageList = document.getElementById("user_chats_message_list");
    const messageInput = document.getElementById("user_chats_message_input");
    const fileInput = document.getElementById("user_chats_file_input");
    const sendButton = document.getElementById("user_chats_send_button");
    const errorMessage = document.getElementById("user_chats_error_message");

    // Fetch and display the user's chats
    const fetchChats = () => {
        fetch("/api/user/chat/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`, // Use your token for authentication
            },
        })
            .then((response) => response.json())
            .then((data) => {
                messageList.innerHTML = ""; // Clear the chat list
                data.forEach((chat) => {
                    const messageItem = document.createElement("div");
                    messageItem.className = chat.type === "user" ? "user-message" : "admin-message";

                    let content = `<p>${chat.message || "File Attached"}</p>`;
                    if (chat.file) {
                        const fileExtension = chat.file.split(".").pop().toLowerCase();
                        if (["png", "jpg", "jpeg", "gif"].includes(fileExtension)) {
                            content += `<img src="${chat.file}" alt="Attached Image" style="max-width: 100%; margin-top: 10px;" />`;
                        } else {
                            content += `<a href="${chat.file}" target="_blank" style="margin-top: 10px; display: inline-block;">Download File</a>`;
                        }
                    }

                    content += `<small>${new Date(chat.created_at).toLocaleString()}</small>`;
                    messageItem.innerHTML = content;
                    messageList.appendChild(messageItem);
                });
            })
            .catch((error) => console.error("Error fetching chats:", error));
    };

    // Send a message or file to the admin
    const sendMessage = () => {
        const message = messageInput.value.trim();
        const file = fileInput.files[0];

        errorMessage.innerText = "";

        if (!message && !file) {
            // Display error message if both message and file are empty
            errorMessage.innerText = "Please enter a message or select a file to send.";
            return;
        }

        const formData = new FormData();
        formData.append("message", message);
        if (file) {
            formData.append("file", file);
        }

        fetch("/api/user/chat/", {
            method: "POST",
            headers: {
                "X-CSRFToken": user_chats_csrfToken // Include the CSRF token
            },
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message) {
                    messageInput.value = ""; // Clear the input
                    fileInput.value = ""; // Clear the file input
                    errorMessage.innerText = "";
                    fetchChats(); // Refresh the chat
                } else {
                    alert("Error sending message.");
                    errorMessage.innerText = "Error sending message.";
                }
            })
            .catch((error) => {
                console.error("Error sending message:", error);
                alert("Error sending message.");
                errorMessage.innerText = "Error sending message.";
            });
    };

    sendButton.addEventListener("click", sendMessage);

    // Fetch chats on page load
    fetchChats();
});

document.addEventListener("DOMContentLoaded", () => {
    const messageList = document.getElementById("admin_contact_reply_message_list");
    const backButton = document.createElement("button");
    backButton.id = "admin_contact_reply_back_button";
    backButton.innerText = "Back";
    backButton.style.display = "none"; // Initially hidden
    backButton.onclick = () => showEmailList();

    const basketIcon = document.createElement("span");
    basketIcon.id = "basket-icon";
    basketIcon.title = "Delete Selected";
    basketIcon.innerHTML = "🗑️";
    basketIcon.style.display = "none"; // Initially hidden
    basketIcon.style.cursor = "pointer";
    basketIcon.style.fontSize = "20px";
    basketIcon.style.marginBottom = "10px";
    basketIcon.onclick = () => deleteSelectedContacts();

    document.querySelector(".admin_contact_reply_container").prepend(basketIcon, backButton);

    let selectedEmails = [];

    fetch("/api/admin/messages/")
    .then((response) => response.json())
    .then((data) => {
        // Convert the object to an array of emails, sorted by created_at
        const sortedEmails = Object.entries(data); 

        sortedEmails.forEach(([email, messages]) => {
            const emailItem = document.createElement("div");
            emailItem.className = "email-item";
            emailItem.innerHTML = `
                <input type="checkbox" class="email-checkbox" data-email="${email}">
                <span class="email-text">${email}</span>
                <span class="last-message"></span>
                <span class="delete-icon" title="Delete Email">🗑️</span>
            `;
            const lastMessageElement = emailItem.querySelector(".last-message");

            fetch(`/api/admin/chat/${email}/`)
            .then((response) => response.json())
            .then((messages) => {
                const lastMessage = messages[messages.length - 1]; // Assuming messages are sorted by created_at
               
                const lastMessageContent = lastMessage?.file
                ? "File Attached" // If a file exists, display "File Attached"
                : lastMessage?.message || "No message"; // Otherwise, show the message or "No message"
                lastMessageElement.innerText = `${lastMessageContent}`;
                if (lastMessageContent.length > 5) {
                    lastMessageElement.innerText = `${lastMessageContent.substring(0, 5)}...`;
                }
             })
            .catch((error) => console.error("Error fetching messages by email:", error));
            
            

            // Attach checkbox selection functionality
            emailItem.querySelector(".email-checkbox").onclick = (e) => handleCheckboxSelection(e, email);

            // Attach delete functionality
            emailItem.querySelector(".delete-icon").onclick = () => deleteContact(email);

            // Open chat on click (excluding the delete icon and checkbox)
            emailItem.querySelector(".email-text").onclick = () => fetchMessagesByEmail(email);

            // Append the email item to the message list
            messageList.appendChild(emailItem);
        });
    })
    .catch((error) => console.error("Error fetching messages:", error));

            const editAdminMessage = (id, oldMessage) => {
            // Open the modal
            const modal = document.getElementById("admin_contact_reply_editMessageModal");
            const editMessageInput = document.getElementById("admin_contact_reply_editMessageInput");
            const editMessageFile = document.getElementById("admin_contact_reply_editMessageFile");
            const editMessageForm = document.getElementById("admin_contact_reply_editMessageForm");
        
            // Populate the existing message
            editMessageInput.value = oldMessage;
            editMessageFile.value = ""; // Reset file input
            modal.style.display = "block";
        
            // Handle the form submission
            editMessageForm.onsubmit = (e) => {
                e.preventDefault();
        
                const newMessage = editMessageInput.value.trim();
                const newFile = editMessageFile.files[0];
                if (!newMessage && !newFile) {
                    alert("Message or file is required.");
                    return;
                }
        
                const formData = new FormData();
                formData.append("reply_message", newMessage);
                if (newFile) {
                    formData.append("file", newFile);
                }
        
                fetch(`/api/admin/reply/${id}/edit_delete/`, {
                    method: "PUT",
                    headers: {
                        "X-CSRFToken": admin_chats_csrfToken // Include the CSRF token
                    },
                    body: formData,
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.message) {
                            alert(data.message);
                            modal.style.display = "none"; // Close the modal
                            fetchMessagesByEmail(document.getElementById("admin_contact_reply_email").value);
                        } else {
                            alert("Error editing message.");
                        }
                    })
                    .catch((error) => {
                        console.error("Error editing message:", error);
                        alert("Error editing message.");
                    });
            };
        };
        
        // Close the modal when clicking the close button or outside the modal
        document.getElementById("admin_contact_reply_closeEditModal").onclick = () => {
            document.getElementById("admin_contact_reply_editMessageModal").style.display = "none";
        };
        
        window.onclick = (event) => {
            const modal = document.getElementById("admin_contact_reply_editMessageModal");
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };
        
        
        const deleteAdminMessage = (id) => {
            if (confirm("Are you sure you want to delete this message?")) {
                fetch(`/api/admin/reply/${id}/edit_delete/`, {
                    method: "DELETE",
                    headers: {
                        "X-CSRFToken": admin_chats_csrfToken // Include the CSRF token
                    },
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.message) {
                            alert(data.message);
                            fetchMessagesByEmail(document.getElementById("admin_contact_reply_email").value);
                        } else {
                            alert("Error deleting message.");
                        }
                    })
                    .catch((error) => {
                        console.error("Error deleting message:", error);
                        alert("Error deleting message.");
                    });
            }
        };
            
    const fetchMessagesByEmail = (email) => {
        fetch(`/api/admin/chat/${email}/`)
            .then((response) => response.json())
            .then((messages) => {
                messageList.innerHTML = "";
                backButton.style.display = "block";
                basketIcon.style.display = "none"; // Hide the basket icon in chat view
                
            const starContainer = document.createElement("div");
            starContainer.className = "star-container";
            starContainer.style.display = "flex";
            starContainer.style.alignItems = "center";
            starContainer.style.marginBottom = "10px";
           

            const starIcon = document.createElement("span");
            
            starIcon.className = "star-icon";
            starIcon.style.cursor = "pointer";
            starIcon.style.fontSize = "24px";
            starIcon.style.marginRight = "8px";
           
            starIcon.onclick = () => toggleStarChat(email, starIcon);

            const starLabel = document.createElement("span");
            
            starLabel.style.fontSize = "16px";

            starContainer.appendChild(starIcon);
            starContainer.appendChild(starLabel);
            messageList.appendChild(starContainer);

                messages.forEach((message) => {
                    
                    const messageItem = document.createElement("div");
                    messageItem.className = message.type === "user" ? "chat-user-message" : "chat-admin-message";
                    if (message.type === "user") {
                        // Create a star icon element const starIcon = document.createElement("span");
                        starIcon.innerHTML = message.starred ? "⭐" : "☆"; // Filled or empty star
                        
                    }
                    let content = `<p>${message.message || "File Attached"}</p>`;

                    if (message.file) {
                        const fileExtension = message.file.split(".").pop().toLowerCase();
                        if (["png", "jpg", "jpeg", "gif"].includes(fileExtension)) {
                            content += `<img src="${message.file}" alt="Attached Image" style="max-width: 100%; margin-top: 10px;" />`;
                        } else {
                            content += `<a href="${message.file}" target="_blank" style="margin-top: 10px; display: inline-block;">Download File</a>`;
                        }
                    }
                    
                    content += `<small>${new Date(message.created_at).toLocaleString()}</small>`;
                   
                    
                    messageItem.innerHTML = content;
                     // Add action icons for admin messages
                if (message.type === "admin") {
                    const actions = document.createElement("div");
                    actions.className = "message-actions";

                    // Edit icon
                    const editIcon = document.createElement("span");
                    editIcon.innerHTML = "✏️"; // Edit icon
                    editIcon.title = "Edit Message";
                    editIcon.onclick = () => editAdminMessage(message.id, message.message);

                    // Delete icon
                    const deleteIcon = document.createElement("span");
                    deleteIcon.innerHTML = "🗑️"; // Delete icon
                    deleteIcon.title = "Delete Message";
                    deleteIcon.onclick = () => deleteAdminMessage(message.id);

                    actions.appendChild(editIcon);
                    actions.appendChild(deleteIcon);
                    messageItem.appendChild(actions);
                }
                    messageList.appendChild(messageItem);
                    
                    
                });

                openReplyForm(email);
            })
            .catch((error) => console.error("Error fetching messages by email:", error));
    };
    // Function to toggle the star status of a chat
const toggleStarChat = (email, starIcon) => {
    const isStarred = starIcon.innerHTML === "⭐";
    fetch("/api/admin/messages/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json" ,
            "X-CSRFToken": admin_chats_csrfToken // Include the CSRF token
        },
        body: JSON.stringify({
            email: email,
            starred: !isStarred,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                starIcon.innerHTML = isStarred ? "☆" : "⭐";
               
            }
        })
        .catch((error) => console.error("Error toggling star status:", error));
};
    const deleteContact = (email) => {
        if (confirm(`Are you sure you want to delete all data for ${email}?`)) {
            fetch(`/api/admin/delete-contact/${email}/`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.message) {
                        alert(data.message);
                        showEmailList(); // Refresh the email list
                    } else {
                        alert("Error deleting contact.");
                    }
                })
                .catch((error) => {
                    console.error("Error deleting contact:", error);
                    alert("Error deleting contact.");
                });
        }
    };

    const handleCheckboxSelection = (e, email) => {
        if (e.target.checked) {
            selectedEmails.push(email);
        } else {
            selectedEmails = selectedEmails.filter((selectedEmail) => selectedEmail !== email);
        }

        // Show or hide the basket icon based on selections
        basketIcon.style.display = selectedEmails.length > 0 ? "inline-block" : "none";
    };

    const deleteSelectedContacts = () => {
        if (selectedEmails.length === 0) {
            alert("No emails selected.");
            return;
        }

        if (confirm(`Are you sure you want to delete the selected emails: ${selectedEmails.join(", ")}?`)) {
            Promise.all(
                selectedEmails.map((email) =>
                    fetch(`/api/admin/delete-contact/${email}/`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    })
                )
            )
                .then(() => {
                    alert("Selected emails have been deleted successfully.");
                    selectedEmails = []; // Clear the selected emails
                    showEmailList(); // Refresh the email list
                })
                .catch((error) => {
                    console.error("Error deleting selected contacts:", error);
                    alert("Error deleting selected contacts.");
                });
        }
    };

    const showEmailList = () => {
        messageList.innerHTML = "";
        backButton.style.display = "none";
        basketIcon.style.display = "none"; // Hide the basket icon when returning to the list
        const replyForm = document.getElementById("admin_contact_reply_form_container");
        replyForm.style.display = "none";

        fetch("/api/admin/messages/")
    .then((response) => response.json())
    .then((data) => {
        // Convert the object to an array of emails, sorted by created_at
        const sortedEmails = Object.entries(data); 

        sortedEmails.forEach(([email, messages]) => {
            const emailItem = document.createElement("div");
            emailItem.className = "email-item";
            emailItem.innerHTML = `
                <input type="checkbox" class="email-checkbox" data-email="${email}">
                <span class="email-text">${email}</span>
                <span class="last-message"></span>
                <span class="delete-icon" title="Delete Email">🗑️</span>
            `;
            const lastMessageElement = emailItem.querySelector(".last-message");

            fetch(`/api/admin/chat/${email}/`)
            .then((response) => response.json())
            .then((messages) => {
                const lastMessage = messages[messages.length - 1]; // Assuming messages are sorted by created_at
               
                const lastMessageContent = lastMessage?.file
                ? "File Attached" // If a file exists, display "File Attached"
                : lastMessage?.message || "No message"; // Otherwise, show the message or "No message"
                lastMessageElement.innerText = `${lastMessageContent}`;
                if (lastMessageContent.length > 5) {
                    lastMessageElement.innerText = `${lastMessageContent.substring(0, 5)}...`;
                }
             })
            .catch((error) => console.error("Error fetching messages by email:", error));
            
            

            // Attach checkbox selection functionality
            emailItem.querySelector(".email-checkbox").onclick = (e) => handleCheckboxSelection(e, email);

            // Attach delete functionality
            emailItem.querySelector(".delete-icon").onclick = () => deleteContact(email);

            // Open chat on click (excluding the delete icon and checkbox)
            emailItem.querySelector(".email-text").onclick = () => fetchMessagesByEmail(email);

            // Append the email item to the message list
            messageList.appendChild(emailItem);
        });
    })
    .catch((error) => console.error("Error fetching messages:", error));

    };

    const openReplyForm = (email) => {
        const replyForm = document.getElementById("admin_contact_reply_form_container");
        replyForm.style.display = "block";
        document.getElementById("admin_contact_reply_email").value = email;
    };




    document.getElementById("admin_contact_reply_form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("admin_contact_reply_email").value;
        const replyMessage = document.getElementById("admin_contact_reply_message").value.trim();
        const adminreplyMessage = document.getElementById("admin_contact_reply_message")
        const fileInput = document.getElementById("admin_contact_reply_file");
        const responseMessage = document.getElementById("admin_contact_reply_response_message");

        // Frontend validation: Check if the replyMessage is empty
        if (!replyMessage && !fileInput.files.length) {
            responseMessage.innerText = "Reply message or file is required.";
            responseMessage.style.color = "red";
            return;
        }

        const formData = new FormData();
        formData.append("email", email);
        formData.append("message", replyMessage);

        if (fileInput.files[0]) {
            formData.append("file", fileInput.files[0]);
        }

        try {
            const response = await fetch("/api/admin/reply/", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.message) {
                responseMessage.innerText = data.message;
                responseMessage.style.color = "green";
                adminreplyMessage.value = ""; // Reset replyMessage input
                fileInput.value = ""; 
                fetchMessagesByEmail(email);
            } else {
                responseMessage.innerText = "Error sending reply.";
                responseMessage.style.color = "red";
            }
        } catch (error) {
            console.error("Error sending reply:", error);
            responseMessage.innerText = "Error sending reply.";
            responseMessage.style.color = "red";
        }
    });
});
document.addEventListener("DOMContentLoaded", () => {
    const faqItems = document.querySelectorAll('.faq-item');
    const faqTitleMain = document.getElementById('faq-title-main');
    const faqText = document.getElementById('faq-text');
  
    // Define unique content for each FAQ item
    const faqContent = {
      "faq1": "Yes, we use advanced SSL encryption and adhere to strict data protection policies to ensure your information is safe.",
      "faq2": "Absolutely. Our website is mobile-friendly, and we also offer apps for iOS and Android devices for seamless gaming on the go.",
      "faq3": "Click the 'Forgot Password' link on the login page, enter your registered email, and follow the instructions to reset your password.",
      "faq4": "You must be at least 18 years old or meet the legal gambling age in your jurisdiction to use our platform.",
      "faq5": "We do not charge fees for deposits. Withdrawal fees depend on the payment method you choose, which will be clearly stated during the process.",
      "faq6": "If a game crashes, the outcome of any completed bets will remain valid, and you can resume the game where it left off. Contact support if the issue persists.",
      "faq7": "If you wish to close your account, contact customer support for assistance. You may also use self-exclusion options in your account settings.",
      "faq8": "Some details, like your password, can be updated directly in your account settings. For sensitive information like your registered email, contact support.",
      "faq9": "The minimum deposit amount varies by payment method but is generally [insert amount, e.g., $10].",
      "faq10": "Log in to your account, navigate to the “Payments” section, and add or update your preferred payment methods."
    };
  
    // Display the first FAQ item by default
    if (faqItems.length > 0) {
      const firstFaq = faqItems[0];
      const targetId = firstFaq.getAttribute('data-target');
      firstFaq.classList.add('expanded');
      firstFaq.querySelector('.icon').textContent = '-';
      faqTitleMain.textContent = firstFaq.querySelector('.faq-title').textContent;
      faqText.textContent = faqContent[targetId];
    }
  
    // Add click event listeners to each FAQ item
    faqItems.forEach(item => {
      item.addEventListener('click', () => {
        // Collapse all FAQ items
        faqItems.forEach(faq => {
          faq.classList.remove('expanded');
          faq.classList.remove('faded');
          faq.querySelector('.icon').textContent = '+';
        });
  
        // Expand the clicked FAQ item
        item.classList.add('expanded');
        item.querySelector('.icon').textContent = '-';
  
        // Apply faded class to non-selected FAQ items
        faqItems.forEach(faq => {
          if (faq !== item) {
            faq.classList.add('faded');
          }
        });
  
        // Update the main content area with unique content
        const targetId = item.getAttribute('data-target');
        faqTitleMain.textContent = item.querySelector('.faq-title').textContent;
        faqText.textContent = faqContent[targetId] || "No detailed content available for this FAQ.";
      });
    });
  });
  
// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById("contact-form");
    const responseMessage = document.getElementById("contact-response-message");

    // Handle form submission
    contactForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        try {
            const name = document.getElementById("contact-name").value;
            const email = document.getElementById("contact-email").value;
            const description = document.getElementById("contact-description").value;

            const response = await fetch("/api/contact/", {
                method: "POST",
                
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRFToken": contact_csrfToken
                },
                body: JSON.stringify({ name, email, description }),
            });

            if (response.ok) {
                const data = await response.json();
                responseMessage.innerText = data.message;
                responseMessage.style.color = "green";
                contactForm.reset(); // Clear the form after success
            } else {
                const errorData = await response.json();
                responseMessage.innerText = errorData.email ? errorData.email[0] : "No error message found";
                responseMessage.style.color = "red";
            }
        } catch (error) {
            console.error("Error submitting contact form:", error);
            responseMessage.innerText = "Error: Unable to submit the form.";
            responseMessage.style.color = "red";
        }
    });
});
/*-----------------navbar-------*/

  
function toggleMenu() {
    const navbarLinks = document.querySelector('.navbar-links');
    navbarLinks.classList.toggle('active');

    const hamburger = document.querySelector('.hamburger');
    hamburger.classList.toggle('active');
}

// custom_admin_dashboard.html
function showSpecificDiv(id) {
    // Select the section and the specific div by id
    const section = document.querySelector(".custom_admin_dashboard_dashboard");
    const specificDiv = document.getElementById(id);

    if (specificDiv) {
        // Hide all children of the section using opacity and z-index
        Array.from(section.children).forEach(child => {
            child.style.visibility = "hidden";
            child.style.opacity = "0";
            child.style.position = "absolute";
        });

        // Show only the specific div
        specificDiv.style.visibility = "visible";
        specificDiv.style.opacity = "1";
        specificDiv.style.position = "relative";

        // Ensure the section itself is visible
        section.style.visibility = "visible";
    } else {
        console.error(`Element with id "${id}" not found.`);
    }
}
let salesChart; // Store chart instance for dynamic updates
// Function to fetch and display sales data
function fetchSalesData(year) {
    $.ajax({
        url: `/api/lottery_sales_bar_chart/`,
        method: 'GET',
        data: { year: year },
        success: function (data) {
            const labels = data.map(item => item.month);
            const activityCounts = data.map(item => item.activity_count);

            // If the chart already exists, update it
            if (salesChart) {
                salesChart.data.labels = labels;
                salesChart.data.datasets[0].data = activityCounts;
                salesChart.update();
            } else {
                // Create the chart for the first time
                const ctx = document.getElementById('salesChart').getContext('2d');
                salesChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Sales Count',
                            data: activityCounts,
                            backgroundColor: 'rgba(255, 87, 34, 0.8)', // Matching orange color
                            borderColor: 'rgba(255, 87, 34, 1)',
                            borderWidth: 0, // No border for clean design
                            borderRadius: 8, // Rounded bars
                            barPercentage: 0.6, // Adjust bar width
                            hoverBackgroundColor: 'rgba(255, 87, 34, 1)' // Slightly darker hover color
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false // Hiding the legend for simplicity
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark tooltip
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                padding: 10,
                                cornerRadius: 4
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Months', // X-axis label
                                    color: '#555',
                                    font: {
                                        size: 14,
                                        weight: 'bold'
                                    }
                                },
                                grid: {
                                    display: false // Hide grid lines on x-axis
                                },
                                ticks: {
                                    color: '#888', // Grey text for months
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    }
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'lottery Sales Count', // Y-axis label
                                    color: '#555',
                                    font: {
                                        size: 14,
                                        weight: 'bold'
                                    }
                                },
                                grid: {
                                    color: 'rgba(200, 200, 200, 0.3)' // Light grid lines
                                },
                                ticks: {
                                    beginAtZero: true,
                                    color: '#888',
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        }
                    }
                });
            }
        },
        error: function (error) {
            console.error('Error fetching sales data:', error);
            alert('Failed to fetch sales data.');
        }
    });
}



// Function to populate the year dropdown dynamically
function populateYearDropdown() {
    $.ajax({
        url: `/api/lottery_sales_available_years/`, // API endpoint for years
        method: 'GET',
        success: function (data) {
            const years = data.years;
            const yearSelect = $("#yearSelect");
            const currentYear = new Date().getFullYear(); // Get the current year

            // Clear existing options
            yearSelect.empty();

            // Populate options
            years.forEach(year => {
                yearSelect.append(new Option(year, year));
            });

            // Set the current year as default if available, otherwise the first year
            const defaultYear = years.includes(currentYear) ? currentYear : years[0];
            yearSelect.val(defaultYear);

            // Fetch and display data for the default year
            fetchSalesData(defaultYear);
        },
        error: function (error) {
            console.error('Error fetching available years:', error);
            alert('Failed to fetch years.');
        }
    });
}

// Event listener for year selection
function dynamic_lottery_sales_bar_chart () {
    // Populate year dropdown on page load
    populateYearDropdown();

    // Update chart when a new year is selected
    $("#yearSelect").on("change", function () {
        const selectedYear = $(this).val();
        fetchSalesData(selectedYear);
    });
}

function fetchStatistics(month, year) {
    $.ajax({
        url: `/api/statistics/`, // API endpoint
        method: 'GET',
        data: {
            month: month,
            year: year
        },
        success: function (data) {
           
            $("#active_users").text(`${data.active_users} / ${data.total_users}`);
            $("#won_lottery").text(data.won_lottery);
            $("#lost_lottery").text(data.lost_lottery);
            $("#won_percentage").text(data.won_percentage.toFixed(2)+ " %");
            $("#current_won_percentage").text(data.current_won_percentage.toFixed(2)+ " %");
            $("#lost_percentage").text(data.lost_percentage.toFixed(2)+ " %");
        },
        error: function (error) {
            console.error('Error fetching data:', error);
            alert('Failed to fetch data.');
        }
    });
}


// Event listener for the filter button
function lottery_sales_count() {
    $("#filterBtn").on("click", function () {
        const month = $("#month").val();
        const year = $("#year").val();
        fetchStatistics(month, year);
    });

    // Fetch initial data for the current month and year
    const currentMonth = new Date().getMonth() + 1; // Months are 0-indexed
    const currentYear = new Date().getFullYear();
    $("#month").val(currentMonth);
    $("#year").val(currentYear);
    fetchStatistics(currentMonth, currentYear);
}

// Fetch leaderboard data using AJAX
    function user_leaderboard () {
      $.ajax({
        url: '/api/leaderboard/', // Replace with your Django API endpoint
        method: 'GET',
        success: function (data) {
          const leaderboard = $('#leaderboard');
          leaderboard.empty(); // Clear existing data

          // Populate leaderboard with fetched data
          data.forEach((item) => {
            leaderboard.append(`
              <div class="leaderboard-item">
                <div class="user-info">
                  <img src="${item.image || 'https://via.placeholder.com/50'}" alt="User Image">
                  <div>
                    <span class="username">${item.username}</span>
                    <div class="correct-percentage">${item.correct_percentage.toFixed(2)}% Correct</div>
                  </div>
                </div>
                <div class="points">
                  <span class="rank">${item.rank} ${item.rank_change > 0 ? '<span class="arrow-up">▲</span>' : '<span class="arrow-down">▼</span>'}</span><br>
                  <span>${item.points} Points</span>
                </div>
              </div>
            `);
          });
        },
        error: function (xhr, status, error) {
          console.error('Error fetching leaderboard data:', error);
        }
      });
    }
        
function initializeDashboard() {
    try {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof api_navbar_access_tabsView_url === 'undefined' || typeof api_dashboard_preview_admin_view_url === 'undefined') {
                
                return;
            }
            try {
                fetch(api_navbar_access_tabsView_url, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        try {
                            const sidebar = document.querySelector(".custom_admin_dashboard_sidebar nav ul");
                            sidebar.innerHTML = ""; // Clear existing tabs
                            data.forEach(tab => {
                                const li = document.createElement("li");
                                li.innerHTML = `<a href="${tab.resolved_url}" onclick="showSpecificDiv('${tab.identifier}')">${tab.name}</a>`;
                                sidebar.appendChild(li);
                                
                            });
                        } catch (error) {
                            console.error("Error processing sidebar data:", error);
                        }
                    })
                    .catch(error => console.error("Error fetching tabs:", error));

                fetch(api_dashboard_preview_admin_view_url)
                    .then(response => response.json())
                    .then(({ data, tabs, table_data }) => {
                        try {
                            const dashboard = document.querySelector('.custom_admin_dashboard_overview_count');
                            const Statistics_count_dashboard = document.querySelector('.custom_admin_dashboard_overview_statistics_count');
                            const tableContainer = document.querySelector('.custom_admin_dashboard_user_table');
                            const custom_admin_dashboard_conversion_rate_Container = document.querySelector('.custom_admin_dashboard_conversion_rate');

                            tabs.forEach(tab => {
                                try {
                                    if (tab.type === 'count') {
                                        const container = document.createElement('div');
                                        container.className = 'custom_admin_dashboard_card';
                                        container.innerHTML = `
                                            <h2>${tab.name}</h2>
                                            <p id="${tab.identifier}">${data[tab.identifier] || 0}</p>
                                        `;
                                        dashboard.appendChild(container);
                                    }else if (tab.type === 'Statistics_count') {
                                        const container = document.createElement('div');
                                        container.className = 'custom_admin_dashboard_card';
                                        const lottery_sales_dynamic_count_filter= document.getElementById("lottery_sales_dynamic_count_filter");
                                        lottery_sales_dynamic_count_filter.style.display = "block";
                                        container.innerHTML = `
                                            <h2>${tab.name}</h2>
                                            <p id="${tab.identifier}"></p>
                                        `;
                                        Statistics_count_dashboard.appendChild(container);
                                        lottery_sales_count();
                                    }else if (tab.type === 'lottery_sales_overview') {
                                        const custom_admin_dashboard_bar_chart_filter= document.getElementById("custom_admin_dashboard_bar_chart_filter");
                                        custom_admin_dashboard_bar_chart_filter.style.display = "block";    
                                        dynamic_lottery_sales_bar_chart();
                                    }else if (tab.type === 'user_leaderboard') {
                                        const leaderboard_container= document.getElementById("leaderboard");
                                        leaderboard_container.style.display = "block";  
                                        const leaderboard_title =  document.getElementById("leaderboard_title");
                                        leaderboard_title.className = 'custom_admin_dashboard_leaderboard_title';
                                        leaderboard_title.textContent = tab.name;    
                                        user_leaderboard();
                                    }else if (tab.type === 'table') {
                                        const title = document.createElement('h2');
                                        title.className = 'custom_admin_dashboard_table_title';
                                        title.textContent = tab.name;
                                        tableContainer.appendChild(title);

                                        const table = document.createElement('table');
                                        table.className = 'custom_admin_dashboard_custom_table';
                                        table.innerHTML = `
                                            <thead>
                                                <tr>
                                                    <th>Account Status</th>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>KYC Image</th>
                                                    <th>id</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody></tbody>
                                        `;

                                        tableContainer.appendChild(table);

                                        const tbody = table.querySelector('tbody');
                                        const rows = table_data[tab.identifier] || [];
                                        let currentIndex = 0;
                                        const rowsPerPage = 3;

                                        const renderRows = () => {
                                            try {
                                                const slice = rows.slice(currentIndex, currentIndex + rowsPerPage);
                                                slice.forEach(row => {
                                                    const tr = document.createElement('tr');
                                                    tr.innerHTML = `
                                                        <td>
                                                            <select class="user_kyc_waiting_list-kyc-statusselect" data-user-id="${row.user?.id}">
                                                                <option value="waiting" ${row.kyc_status === 'waiting' ? 'selected' : ''}>Waiting</option>
                                                                <option value="verified" ${row.kyc_status === 'verified' ? 'selected' : ''}>Verified</option>
                                                                <option value="rejected" ${row.kyc_status === 'rejected' ? 'selected' : ''}>Rejected</option>
                                                                <option value="pending" ${row.kyc_status === 'pending' ? 'selected' : ''}>Pending</option>
                                                            </select>
                                                        </td>
                                                        <td>${row.user?.username || 'N/A'}</td>
                                                        <td>${row.user?.email || 'N/A'}</td>
                                                        <td>
                                                            ${
                                                                row.kyc_image_url
                                                                    ? `<a href="#" class="view-kyc-image" data-imageurl="${row.kyc_image_url}" data-username="${row.user?.username || 'N/A'}" data-email="${row.user?.email || 'N/A'}" data-kycstatus="${row.kyc_status || 'N/A'}">View KYC Image</a>`
                                                                    : 'KYC not submitted'
                                                            }
                                                        </td>
                                                        <td>${row.ip_address || 'N/A'}</td>
                                                        <td>
                                                            <button class="delete-button" data-user-id="${row.user?.id}">Delete</button>
                                                        </td>
                                                    `;
                                                    tbody.appendChild(tr);
                                                });

                                                currentIndex += rowsPerPage;
                                                if (currentIndex >= rows.length) {
                                                    viewMoreButton.style.display = 'none';
                                                }
                                            } catch (error) {
                                                console.error("Error rendering rows:", error);
                                            }
                                        };

                                        const viewMoreButton = document.createElement('button');
                                        viewMoreButton.textContent = 'View More';
                                        viewMoreButton.className = 'view-more-button';
                                        viewMoreButton.style.display = rows.length > rowsPerPage ? 'block' : 'none';
                                        viewMoreButton.addEventListener('click', renderRows);
                                        tableContainer.appendChild(viewMoreButton);
                                        renderRows();
                                    } else if (tab.type === 'lotterys') {
                                        const pageTitle = document.getElementById('lottery_card_title');
                                        pageTitle.textContent = tab.name;

                                        const lottery_element = document.querySelector('.custom_admin_dashboard_lottery-events-grid');
                                        if (lottery_element) lottery_element.style.display = 'grid';

                                        fetchLotteryEvents();
                                        fetchLotteryCategories();

                                        const lottery_view_more_button_label = document.getElementById("custom_admin_dashboard_view-more-button");
                                        if (lottery_view_more_button_label) {
                                            lottery_view_more_button_label.removeAttribute("hidden");
                                        }
                                        const add_lottery_icon = document.querySelector('.custom_admin_dashboard_open-form-btn');
                                        if (add_lottery_icon) {
                                            add_lottery_icon.style.display = 'inline-block';
                                        }

                                        document.getElementById('custom_admin_dashboard_openFormButton').onclick = function () {
                                            document.getElementById('lotteryEventModal').style.display = 'block';
                                        };

                                        document.getElementById('custom_admin_dashboard_closeModal').onclick = function () {
                                            document.getElementById('lotteryEventModal').style.display = 'none';
                                        };

                                        window.onclick = function (event) {
                                            if (event.target == document.getElementById('lotteryEventModal')) {
                                                document.getElementById('lotteryEventModal').style.display = 'none';
                                            }
                                        };
                                    } else if (tab.type === 'rate') {
                                        const title = document.createElement('h2');
                                        title.className = 'custom_admin_dashboard_table_title';
                                        title.textContent = tab.name;

                                        custom_admin_dashboard_conversion_rate_Container.appendChild(title);

                                        const table = document.createElement('table');
                                        table.className = 'custom_admin_dashboard_custom_table';
                                        table.innerHTML = `
                                            <thead>
                                                <tr>
                                                    <th>Card Type</th>
                                                    <th>Region</th>
                                                    <th>Type</th>
                                                    <th>Rate (₦)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${table_data[tab.identifier]?.map(row => `
                                                    <tr>
                                                        <td>${row.card_type}</td>
                                                        <td>${row.region}</td>
                                                        <td>${row.is_physical ? 'Physical' : 'E-Code'}</td>
                                                        <td>${row.rate}</td>
                                                    </tr>
                                                `).join('') || ''}
                                            </tbody>
                                        `;
                                        custom_admin_dashboard_conversion_rate_Container.appendChild(table);
                                    }
                                } catch (error) {
                                    console.error(`Error processing tab: ${tab.name}`, error);
                                }
                            });
                        } catch (error) {
                            console.error("Error processing dashboard data:", error);
                        }
                    })
                    .catch(error => console.error("Error fetching dashboard data:", error));
            } catch (error) {
                console.error("Error initializing dashboard:", error);
            }
        });
    } catch (error) {
        console.error("Error setting up DOMContentLoaded listener:", error);
    }
}

// Call the function
initializeDashboard();

    try {
        document.addEventListener('click', function (event) {
            if (event.target.classList.contains('delete-button')) {
                const userId = event.target.getAttribute('data-user-id');
    
                // Confirm deletion
                if (!confirm('Are you sure you want to delete this user?')) {
                    return;
                }
    
                // Send DELETE request
                fetch(`/api/delete_user/${userId}/`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken // Include CSRF token if required
                    }
                })
                .then(response => {
                    if (response.ok) {
                        // Remove the row from the table
                        event.target.closest('tr').remove();
                        alert('User deleted successfully.');
                    } else {
                        return response.json().then(err => {
                            alert(err.error || 'Failed to delete the user.');
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while deleting the user.');
                });
            }
        });
    
        $(document).on('click', '.view-kyc-image', function(event) {
            try {
                event.preventDefault();
                var imageUrl = $(this).data('imageurl');
                var userName = $(this).data('username');
                var userEmail = $(this).data('email');
                var kycStatus = $(this).data('kycstatus');
    
                $('#custom_admin_user_kyc_waiting_list-userName').text(userName);
                $('#custom_admin_user_kyc_waiting_list-userEmail').text(userEmail);
                $('#custom_admin_user_kyc_waiting_list-kycStatus').text(kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1));
                $('#custom_admin_user_kyc_waiting_list-kycImage').attr('src', imageUrl);
                $('#custom_admin_user_kyc_waiting_list-kycModal').show();
    
                $('.user_kyc_waiting_list-close-btn').on('click', function() {
                    $('#custom_admin_user_kyc_waiting_list-kycModal').hide();
                });
    
                $(window).on('click', function(event) {
                    if ($(event.target).is('#custom_admin_user_kyc_waiting_list-kycModal')) {
                        $('#custom_admin_user_kyc_waiting_list-kycModal').hide();
                    }
                });
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while viewing the KYC image.');
            }
        });
    
        $(document).on('blur', '.user_kyc_waiting_list-kyc-statusselect', function () {
            try {
                const userId = $(this).data('user-id'); // Get the user ID from the data attribute
                const newStatus = $(this).val(); // Get the selected status
    
                // Perform an AJAX POST request to update the KYC status
                $.ajax({
                    url: adminupdaetkycapprovalUrl, // The URL to handle KYC approval updates
                    type: 'POST',
                    data: JSON.stringify({ user_id: userId, kyc_status: newStatus }), // Send the user ID and new status
                    contentType: 'application/json',
                    headers: { 'X-CSRFToken': csrfToken }, // Include CSRF token for security
                    success: function (response) {
                        alert(`KYC status updated to ${newStatus}`); // Notify the user of success
                    },
                    error: function (xhr, status, error) {
                        alert(`Failed to update KYC status: ${error}`); // Notify the user of failure
                    }
                });
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while updating the KYC status.');
            }
        });
    } catch (error) {
        console.error('Unexpected Error:', error);
    }
/*----------addimages-----*/
document.addEventListener('DOMContentLoaded', function () {
    const addImageButton = document.getElementById('add-image-button');
    const imagesContainer = document.getElementById('additional-images-container');

    // Function to add a new image field
    function addImageField() {
        const newImageField = document.createElement('div');
        newImageField.className = 'additional-image-field';

        newImageField.innerHTML = `
            <input type="file" name="additional_images[]" accept="image/*">
            <button type="button" class="remove-image-button">Remove</button>
        `;

        const imageInput = newImageField.querySelector('input');
        imageInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = function (e) {
                const preview = document.createElement('img');
                preview.src = e.target.result;
                preview.className = 'image-preview';
                newImageField.appendChild(preview);
            };

            reader.readAsDataURL(file);
        });
         imagesContainer.appendChild(newImageField);
        newImageField.querySelector('.remove-image-button').addEventListener('click', function () {
            newImageField.remove();
        });
    }

    // Add 5 default image fields on page load
    for (let i = 0; i < 5; i++) {
        addImageField();
    }

    // Attach event listener to "Add Another Image" button
    addImageButton.addEventListener('click', function () {
        addImageField();
    });

    // Attach remove functionality to default image fields
    const defaultRemoveButtons = document.querySelectorAll('.remove-image-button');
    defaultRemoveButtons.forEach(button => {
        button.addEventListener('click', function () {
            button.parentElement.remove();
        });
    });
});

//lottery_events_add.html
document.addEventListener('DOMContentLoaded', function () {
    const totalBudgetInput = document.getElementById('lottery_events_add_totalBudget');
    const revenueTypeSelect = document.getElementById('lottery_events_add_revenueType');
    const fixedRevenueInput = document.getElementById('lottery_events_add_fixedRevenue');
    const percentageRevenueSelect = document.getElementById('lottery_events_add_percentageRevenue');
    const totalAmountInput = document.getElementById('lottery_events_add_totalAmount');
    const perTicketPriceInput = document.getElementById('lottery_events_add_perTicketPrice');
    const totalTicketsInput = document.getElementById('lottery_events_add_totalTickets');

    const fixedAmountDiv = document.getElementById('lottery_events_add_fixedAmountInput');
    const percentageDiv = document.getElementById('lottery_events_add_percentageInput');
    const lottery_events_add_total_amount_container = document.getElementById('lottery_events_add_total_amount_container');
    const lottery_events_add_total_tickets_container = document.getElementById('lottery_events_add_total_tickets_container');

    // Toggle Revenue Input Fields Based on Selected Revenue Type
    revenueTypeSelect.addEventListener('change', () => {
        const selectedType = revenueTypeSelect.value;
        if (selectedType === 'fixed') {
            fixedAmountDiv.style.display = 'block';
            percentageDiv.style.display = 'none';
        } else if (selectedType === 'percentage') {
            fixedAmountDiv.style.display = 'none';
            percentageDiv.style.display = 'block';
            lottery_events_add_total_amount_container.style.display = 'block'; // Always show for percentage
        }
        lottery_events_updateTotalAmount();
    });

    // Update Total Amount
    const lottery_events_updateTotalAmount = () => {
        const totalBudget = parseFloat(totalBudgetInput.value) || 0;
        let totalAmount = totalBudget;

        if (revenueTypeSelect.value === 'fixed') {
            const fixedRevenue = parseFloat(fixedRevenueInput.value) || 0;
            if (fixedRevenue > 0) {
                totalAmount += fixedRevenue;
                lottery_events_add_total_amount_container.style.display = 'block'; // Show Total Amount only when fixed revenue is entered
            } else {
                lottery_events_add_total_amount_container.style.display = 'none'; // Hide Total Amount if no fixed revenue
            }
        } else if (revenueTypeSelect.value === 'percentage') {
            const percentageRevenue = parseFloat(percentageRevenueSelect.value) || 0;
            totalAmount += (totalBudget * percentageRevenue) / 100;
            lottery_events_add_total_amount_container.style.display = 'block'; // Always show for percentage
        }

        totalAmountInput.value = totalAmount.toFixed(2);
        lottery_events_updateTotalTickets();
    };

    // Update Total Tickets
    const lottery_events_updateTotalTickets = () => {
        const totalAmount = parseFloat(totalAmountInput.value) || 0;
        const perTicketPrice = parseFloat(perTicketPriceInput.value) || 0;

        if (perTicketPrice > 0) {
            const totalTickets = totalAmount / perTicketPrice;
            totalTicketsInput.value = Math.ceil(totalTickets); // Round up to the nearest whole number
            lottery_events_add_total_tickets_container.style.display = 'block'; // Show Total Tickets when Per Ticket Price is entered
        } else {
            lottery_events_add_total_tickets_container.style.display = 'none'; // Hide Total Tickets if no Per Ticket Price
        }
    };

    // Add Event Listeners for Inputs
    totalBudgetInput.addEventListener('input', lottery_events_updateTotalAmount);
    fixedRevenueInput.addEventListener('input', lottery_events_updateTotalAmount);
    percentageRevenueSelect.addEventListener('input', lottery_events_updateTotalAmount);
    perTicketPriceInput.addEventListener('input', lottery_events_updateTotalTickets);
});


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
    errorElement.text(' ');
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

            // Handle additional images
            let additionalImagesHtml = '';
            if (event.additional_images && event.additional_images.length > 0) {
                additionalImagesHtml = '<div class="additional-images"><h4>Additional Images:</h4>';
                event.additional_images.forEach((image, index) => {
                    additionalImagesHtml += `
                        <div class="additional-image-item" data-image-id="${image.id}">
                            <img src="${image.image}" alt="Additional Image" class="lottery-events-additional-image"/>
                            <button class="remove-image-btn" onclick="removeAdditionalImage(${image.id}, ${event.id})">Remove</button>
                        </div>`;
                });
                additionalImagesHtml += '</div>';
            }    


                eventDiv.innerHTML = `
                    <h3>
                        <span class="lottery_events_add_title">${event.title}</span>
                        <input type="text" class="lottery_events_add_edit_title" value="${event.title}" data-original-value="${event.title}" required>
                        <div class="lottery_events_add_error_message lottery_edit_title_error">Title is required</div>
                    </h3>

                    <p>
                        Description:<span class="lottery_events_add_description">${event.description}</span>
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
                    <p>Category: <strong>${event.category.name}</strong></p>
                    <p>
                        Status: <span class="lottery_events_add_is_active">${event.is_active ? 'Active' : 'Inactive'}</span>
                        <input type="checkbox" class="lottery_events_add_edit_is_active" ${event.is_active ? 'checked' : ''} data-original-checked="${event.is_active}">
                    </p>
                    <p>
                        Total Tickets: <span class="lottery_events_add_total_tickets">${event.total_tickets}</span>
                        <input type="number" class="lottery_events_add_edit_total_tickets" value="${event.total_tickets}" data-original-value="${event.total_tickets}" required readonly>
                        <div class="lottery_events_add_error_message lottery_edit_total_tickets_error">Total Tickets are required</div>
                    </p>
                    ${event.image ? `<img src="${event.image}" alt="${event.title}" class="lottery_events_add_current_image"/>` : ''}
                    <input type="file" class="lottery_events_add_edit_image" accept="image/*">
                    <p>
                        Total Budget: <span class="lottery_events_add_total_budget">${event.total_budget}</span>
                        <input type="number" class="lottery_events_add_edit_total_budget" value="${event.total_budget}" data-original-value="${event.total_budget}" required>
                        <div class="lottery_events_add_error_message lottery_edit_total_budget_error">Total Budget is required</div>
                    </p>
                    <p>
                    Revenue Type:
                    <span class="lottery_events_add_revenue_type">${event.revenue_type}</span>
                    <select class="lottery_events_add_edit_revenue_type" style=" display: none;"; data-original-value="${event.revenue_type}">
                        <option value="fixed" ${event.revenue_type === 'fixed' ? 'selected' : ''}>Fixed</option>
                        <option value="percentage" ${event.revenue_type === 'percentage' ? 'selected' : ''}>Percentage</option>
                    </select>
                    </p>
                    <div class="lottery_events_add_revenue_fields">
                <p class="lottery_events_add_fixed_revenue" style="display: ${event.revenue_type === 'fixed' ? 'block' : 'none'};">
                    Fixed Revenue Amount:
                    <span>${event.revenue_value}</span>
                    <input type="number" class="lottery_events_add_edit_fixed_revenue" value="${event.revenue_value}" data-original-value="${event.revenue_value}">
                </p>
                <p class="lottery_events_add_percentage_revenue" style="display: ${event.revenue_type === 'percentage' ? 'block' : 'none'};">
                    Percentage Revenue:
                    <span>${event.revenue_value}</span>
                    <input type="number" class="lottery_events_add_edit_percentage_revenue" value="${event.revenue_value}" data-original-value="${event.revenue_value}">
                <div class="lottery_events_add_error_message lottery_edit_revenue_error">Revenue Value is required</div>
                </p>
                </div>
                <p>
                    Total Amount: <span class="lottery_events_add_total_amount">${event.total_amount}</span>
                    <input type="number" class="lottery_events_add_edit_total_amount" value="${event.total_amount}" data-original-value="${event.total_amount}" required readonly>
                </p>
                <p>
                    Per Ticket Price: <span class="lottery_events_add_per_ticket_price">${event.per_ticket_price}</span>
                    <input type="number" class="lottery_events_add_edit_per_ticket_price" value="${event.per_ticket_price}" data-original-value="${event.per_ticket_price}" required>
                <div class="lottery_events_add_error_message lottery_edit_per_ticket_price_error">Per Ticket Price is required</div>
                </p>
                 <!-- Mini Limit -->
                <p>
                    Mini Limit: <span class="lottery_events_add_minilimit">${event.mini_limit}</span>
                    <input type="number" class="lottery_events_add_edit_minilimit" value="${event.mini_limit}" data-original-value="${event.mini_limit}" required>
                    <div class="lottery_events_add_error_message lottery_edit_minilimit_error">Minimum Tickets must be greater than zero </div>
                </p>

                <!-- Max Limit -->
                <p>
                    Max Limit: <span class="lottery_events_add_maxlimit">${event.max_limit}</span>
                    <input type="number" class="lottery_events_add_edit_maxlimit" value="${event.max_limit}" data-original-value="${event.max_limit}" required>
       
                    <div class="lottery_events_add_error_message lottery_edit_maxlimit_error">Maximum Tickets must be greater than zero and not less than Minimum Tickets</div>
                </p>

                <!-- Free Postal Description -->
                <p>
                    Free Postal Description: <span class="lottery_events_add_freepostal">${event.free_postal_description}</span>
                    <textarea class="lottery_events_add_edit_freepostal" data-original-value="${event.free_postal_description}" required>${event.free_postal_description}</textarea>
                    <div class="lottery_events_add_error_message lottery_edit_freepostal_error">Free Postal Description is required</div>
                </p>

                <!-- Competition Details -->
                <p>
                    Competition Details: <span class="lottery_events_add_competitiondetails">${event.competition_details}</span>
                    <textarea class="lottery_events_add_edit_competitiondetails" data-original-value="${event.competition_details}" required>${event.competition_details}</textarea>
                    <div class="lottery_events_add_error_message lottery_edit_competitiondetails_error">Competition Details are required</div>
                </p>
                <!-- Additional Images Section -->
                <div class="additional-images-container">
                    ${additionalImagesHtml}
                     </div>


                     <button type="button" class="add-image-button" style="display:none;">Add Another Image</button>
            
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
// Remove a specific additional image
function removeAdditionalImage(imageIndex, eventId) {
const imageItem = document.querySelector(`[data-image-id="${imageIndex}"]`);

if (confirm("Are you sure you want to delete this image?")) {
    const url = `/lottery-events/${eventId}/additional-images/${imageIndex}/delete/`;

    fetch(url, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': lottery_events_add_csrftoken, // Include CSRF token for security
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (response.ok) {
            return response.json(); // Assuming the API returns a JSON response
        } else {
            throw new Error(`Failed to delete image: ${response.status}`);
        }
    })
    .then(data => {
        // Remove the image from the UI
        imageItem.remove();
        alert(data.message || 'Image deleted successfully');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the image.');
    });
}
}
    // Enable edit mode for a specific lottery event card
   // Calculate and update dynamic fields
   function lottery_events_updateDynamicFields(card) {
    const totalBudgetInput = card.querySelector('.lottery_events_add_edit_total_budget');
    const revenueTypeSelect = card.querySelector('.lottery_events_add_edit_revenue_type');
    const fixedRevenueInput = card.querySelector('.lottery_events_add_edit_fixed_revenue');
    const percentageRevenueInput = card.querySelector('.lottery_events_add_edit_percentage_revenue');
    const perTicketPriceInput = card.querySelector('.lottery_events_add_edit_per_ticket_price');
    const totalAmountInput = card.querySelector('.lottery_events_add_edit_total_amount');
    const totalTicketsInput = card.querySelector('.lottery_events_add_edit_total_tickets');

    let totalBudget = parseFloat(totalBudgetInput.value) || 0;
    let perTicketPrice = parseFloat(perTicketPriceInput.value) || 0;
    let revenueValue = 0;

    // Calculate revenue value based on selected type
    if (revenueTypeSelect.value === 'fixed') {
        revenueValue = parseFloat(fixedRevenueInput.value) || 0;
    } else if (revenueTypeSelect.value === 'percentage') {
        revenueValue = (totalBudget * (parseFloat(percentageRevenueInput.value) || 0)) / 100;
    }

    // Calculate total amount
    const totalAmount = totalBudget + revenueValue;

    // Calculate total tickets
    const totalTickets = perTicketPrice > 0 ? Math.floor(totalAmount / perTicketPrice) : 0;

    // Update input fields dynamically
    totalAmountInput.value = totalAmount.toFixed(2);
    totalTicketsInput.value = totalTickets;
}

// Attach dynamic calculation logic to input fields
function lottery_events_attachDynamicFieldListeners(card) {
    const totalBudgetInput = card.querySelector('.lottery_events_add_edit_total_budget');
    const revenueTypeSelect = card.querySelector('.lottery_events_add_edit_revenue_type');
    const fixedRevenueInput = card.querySelector('.lottery_events_add_edit_fixed_revenue');
    const percentageRevenueInput = card.querySelector('.lottery_events_add_edit_percentage_revenue');
    const perTicketPriceInput = card.querySelector('.lottery_events_add_edit_per_ticket_price');

    // Add event listeners to update calculations
    totalBudgetInput.addEventListener('input', () => lottery_events_updateDynamicFields(card));
    revenueTypeSelect.addEventListener('change', () => lottery_events_updateDynamicFields(card));
    fixedRevenueInput.addEventListener('input', () => lottery_events_updateDynamicFields(card));
    percentageRevenueInput.addEventListener('input', () => lottery_events_updateDynamicFields(card));
    perTicketPriceInput.addEventListener('input', () => lottery_events_updateDynamicFields(card));
}
function lottery_events_enableEditMode(button) {
    const card = button.closest('.lottery-event-card');
    card.classList.add('lottery_events_add_edit_mode');
    // Replace category name with select dropdown
    const categoryField = card.querySelector('p strong'); // Replace category element
    const originalCategory = categoryField.textContent;


    // Create a select element for categories
    const categorySelect = document.createElement('select');
    categorySelect.classList.add('lottery_events_add_edit_category');
    
    // Fetch categories from backend
    fetch('/api/categories/')
    
        .then(response => response.json())
        .then(categories => {
            categories.forEach(category => {
                const option = document.createElement('option');
                
                option.value = category.id;
                option.textContent = category.name;


                // Pre-select the current category
                if (category.name === originalCategory) {
                    option.selected = true;
                }
                categorySelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching categories:', error));


    // Replace static category with the dropdown
    categoryField.replaceWith(categorySelect);

     // Show the "Add Another Image" button and make it visible
    const addImageButton = card.querySelector('.add-image-button');
    addImageButton.style.display = 'block';

    // Add functionality to dynamically add a new image field
    addImageButton.addEventListener('click', function() {
        const imagesContainer = card.querySelector('.additional-images-container');
        const newImageField = document.createElement('div');
        newImageField.className = 'additional-image-item';
        newImageField.innerHTML = `
            <input type="file" name="additional_images[]" accept="image/*">
            <button type="button" class="remove-image-button">Remove</button>
        `;

        // Append the new image input field
        imagesContainer.appendChild(newImageField);

        // Attach remove functionality to the new image remove button
        newImageField.querySelector('.remove-image-button').addEventListener('click', function () {
            newImageField.remove();
        });
    });

    // Add any existing remove buttons to the new fields
    const removeButtons = card.querySelectorAll('.remove-image-button');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            button.parentElement.remove();
        });
    });


    // Show the select dropdown and hide the static text
    const revenueTypeSelect = card.querySelector('.lottery_events_add_edit_revenue_type');
    const revenueTypeSpan = card.querySelector('.lottery_events_add_revenue_type');
    revenueTypeSelect.style.display = 'block';
    revenueTypeSpan.style.display = 'none';

    // Attach dynamic field logic
    lottery_events_attachDynamicFieldListeners(card);

    // Add change listener to the revenue type dropdown for showing/hiding fields
    revenueTypeSelect.addEventListener('change', () => {
        const selectedType = revenueTypeSelect.value;
        const fixedField = card.querySelector('.lottery_events_add_fixed_revenue');
        const percentageField = card.querySelector('.lottery_events_add_percentage_revenue');

        if (selectedType === 'fixed') {
            fixedField.style.display = 'block';
            percentageField.style.display = 'none';
        } else if (selectedType === 'percentage') {
            fixedField.style.display = 'none';
            percentageField.style.display = 'block';
        }

        lottery_events_updateDynamicFields(card); // Recalculate fields on revenue type change
    });
}

// Attach listeners when the page loads

// Clear all error messages
    function lottery_events_edit_clearErrorMessages(card) {
        card.querySelectorAll('.lottery_events_add_error_message').forEach(error => {
            error.style.display = 'none';
        });
    }

    // Reset fields to their original values on cancel
    function lottery_events_edit_resetFields(card) {
        // Reset all input fields to their original values
        card.querySelectorAll('.lottery_events_add_edit_title[type="text"], .lottery_events_add_edit_price[type="number"], .lottery_events_add_edit_total_tickets[type="number"], .lottery_events_add_edit_total_budget[type="number"], .lottery_events_add_edit_total_amount[type="number"], .lottery_events_add_edit_per_ticket_price[type="number"], .lottery_events_add_edit_draw_date[type="datetime-local"], textarea').forEach(input => {
            input.value = input.getAttribute('data-original-value');
        });
    
        // Reset checkbox to its original state
        const checkbox = card.querySelector('.lottery_events_add_edit_is_active');
        if (checkbox) {
            checkbox.checked = checkbox.getAttribute('data-original-checked') === 'true';
        }
    
        // Reset revenue type and its associated fields
        const revenueTypeSelect = card.querySelector('.lottery_events_add_edit_revenue_type');
        const fixedRevenueField = card.querySelector('.lottery_events_add_fixed_revenue');
        const percentageRevenueField = card.querySelector('.lottery_events_add_percentage_revenue');
        const originalRevenueType = revenueTypeSelect.getAttribute('data-original-value');
    
        // Reset the revenue type dropdown to its original value
        revenueTypeSelect.value = originalRevenueType;
    
        // Show/hide fields based on the original revenue type
        if (originalRevenueType === 'fixed') {
            fixedRevenueField.style.display = 'block';
            percentageRevenueField.style.display = 'none';
        } else if (originalRevenueType === 'percentage') {
            fixedRevenueField.style.display = 'none';
            percentageRevenueField.style.display = 'block';
        }
    
        // Reset the value of Fixed Revenue or Percentage Revenue to the original value
        const fixedRevenueInput = card.querySelector('.lottery_events_add_edit_fixed_revenue');
        const percentageRevenueInput = card.querySelector('.lottery_events_add_edit_percentage_revenue');
    
        fixedRevenueInput.value = fixedRevenueInput.getAttribute('data-original-value');
        percentageRevenueInput.value = percentageRevenueInput.getAttribute('data-original-value');
    }
    

    // Cancel edit mode and revert to initial state
    function lottery_events_cancelEdit(button) {
        const card = button.closest('.lottery-event-card');
        lottery_events_edit_resetFields(card); // Reset fields to original values
        lottery_events_edit_clearErrorMessages(card); // Clear error messages when canceling
    
        // Hide the select dropdown and show the static text
        const revenueTypeSelect = card.querySelector('.lottery_events_add_edit_revenue_type');
        const revenueTypeSpan = card.querySelector('.lottery_events_add_revenue_type');
        revenueTypeSelect.style.display = 'none';
        revenueTypeSpan.style.display = 'block';
    
        card.classList.remove('lottery_events_add_edit_mode'); // Exit edit mode
          // Hide the "Add Another Image" button
    const addImageButton = card.querySelector('.add-image-button');
    if (addImageButton) {
        addImageButton.style.display = 'none';
    }

    // Optionally remove dynamically added image fields
    const additionalImagesContainer = card.querySelector('.additional-images-container');
    if (additionalImagesContainer) {
        additionalImagesContainer.innerHTML = ''; // Clear all dynamically added image fields
    }
}  
   
    // Validate required fields and show error messages below each field
    function lottery_events_edit_validateFields(card) {
        let isValid = true;
    
        const title = card.querySelector('.lottery_events_add_edit_title').value.trim();  
        const description = card.querySelector('.lottery_events_add_edit_description').value.trim();
        const price = card.querySelector('.lottery_events_add_edit_price').value.trim();
        const drawDate = card.querySelector('.lottery_events_add_edit_draw_date').value.trim();
        const totalTickets = card.querySelector('.lottery_events_add_edit_total_tickets').value.trim();
        const totalBudget = card.querySelector('.lottery_events_add_edit_total_budget').value.trim();
        const perTicketPrice = card.querySelector('.lottery_events_add_edit_per_ticket_price').value.trim();
        const revenueType = card.querySelector('.lottery_events_add_edit_revenue_type').value.trim();
        const maxLimit = card.querySelector('.lottery_events_add_edit_maxlimit').value.trim();
        const miniLimit = card.querySelector('.lottery_events_add_edit_minilimit').value.trim();
        const freePostalDescription = card.querySelector('.lottery_events_add_edit_freepostal').value.trim();
        const competitionDetails = card.querySelector('.lottery_events_add_edit_competitiondetails').value.trim();
    
        let revenueValue = null;
    
        if (revenueType === 'fixed') {
            revenueValue = card.querySelector('.lottery_events_add_edit_fixed_revenue').value.trim();
        } else if (revenueType === 'percentage') {
            revenueValue = card.querySelector('.lottery_events_add_edit_percentage_revenue').value.trim();
        }
    
        // Display specific error messages if fields are empty
        if (!title) {
            card.querySelector('.lottery_edit_title_error').style.display = 'block';
            isValid = false;
            card.querySelector('.lottery_edit_title_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_title_error').style.display = 'none';
        }
    
        if (!description) {
            card.querySelector('.lottery_edit_description_error').style.display = 'block';
            isValid = false;
            card.querySelector('.lottery_edit_description_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_description_error').style.display = 'none';
        }
    
        if (!price || isNaN(price) || price <= 0) {
            card.querySelector('.lottery_edit_price_error').style.display = 'block';
            isValid = false;
            card.querySelector('.lottery_edit_price_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_price_error').style.display = 'none';
        }
    
        if (!drawDate) {
            card.querySelector('.lottery_edit_draw_date_error').style.display = 'block';
            isValid = false;
            card.querySelector('.lottery_edit_draw_date_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_draw_date_error').style.display = 'none';
        }
    
        if (!totalTickets || isNaN(totalTickets) || totalTickets <= 0) {
            card.querySelector('.lottery_edit_total_tickets_error').style.display = 'block';
            isValid = false;
            card.querySelector('.lottery_edit_total_tickets_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_total_tickets_error').style.display = 'none';
        }
    
        if (!totalBudget || isNaN(totalBudget) || totalBudget <= 0) {
            card.querySelector('.lottery_edit_total_budget_error').style.display = 'block';
            isValid = false;
            card.querySelector('.lottery_edit_total_budget_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_total_budget_error').style.display = 'none';
        }
    
        if (!revenueValue || isNaN(revenueValue) || revenueValue < 0) {
            card.querySelector(`.lottery_edit_revenue_error`).style.display = 'block';
            isValid = false;
            card.querySelector(`.lottery_edit_revenue_error`).scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector(`.lottery_edit_revenue_error`).style.display = 'none';
        }
    
        if (!perTicketPrice || isNaN(perTicketPrice) || perTicketPrice <= 0) {
            card.querySelector('.lottery_edit_per_ticket_price_error').style.display = 'block';
            isValid = false;
            card.querySelector('.lottery_edit_per_ticket_price_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            card.querySelector('.lottery_edit_per_ticket_price_error').style.display = 'none';
        }
        // Mini Limit validation
    if (!miniLimit || miniLimit <= 0) {
        card.querySelector('.lottery_edit_minilimit_error').textContent = 'Mini Limit must be greater than 0.';
        card.querySelector('.lottery_edit_minilimit_error').style.display = 'block';
        isValid = false;
    } else if (maxLimit && parseInt(miniLimit) > parseInt(maxLimit)) {
        card.querySelector('.lottery_edit_minilimit_error').textContent = 'Mini Limit must be less than or equal to Max Limit.';
        card.querySelector('.lottery_edit_minilimit_error').style.display = 'block';
        isValid = false;
    } else {
        card.querySelector('.lottery_edit_minilimit_error').style.display = 'none';
    }
    
    // Max Limit validation
    if (!maxLimit || maxLimit <= 0) {
        card.querySelector('.lottery_edit_maxlimit_error').textContent = 'Max Limit must be greater than 0.';
        card.querySelector('.lottery_edit_maxlimit_error').style.display = 'block';
        isValid = false;
    } else if (miniLimit && parseInt(maxLimit) < parseInt(miniLimit)) {
        card.querySelector('.lottery_edit_maxlimit_error').textContent = 'Max Limit must be greater than or equal to Mini Limit.';
        card.querySelector('.lottery_edit_maxlimit_error').style.display = 'block';
        isValid = false;
    } else {
        card.querySelector('.lottery_edit_maxlimit_error').style.display = 'none';
    }
    
        // Free Postal Description validation
        if (!freePostalDescription) {
            card.querySelector('.lottery_edit_freepostal_error').style.display = 'block';
            isValid = false;
        } else {
            card.querySelector('.lottery_edit_freepostal_error').style.display = 'none';
        }
    
        // Competition Details validation
        if (!competitionDetails) {
            card.querySelector('.lottery_edit_competitiondetails_error').style.display = 'block';
            isValid = false;
        } else {
            card.querySelector('.lottery_edit_competitiondetails_error').style.display = 'none';
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
            const categorySelect = card.querySelector('.lottery_events_add_edit_category');
            const categoryId = categorySelect.value; 
            const title = card.querySelector('.lottery_events_add_edit_title').value;
            const description = card.querySelector('.lottery_events_add_edit_description').value;
            const price = card.querySelector('.lottery_events_add_edit_price').value;
            const drawDate = card.querySelector('.lottery_events_add_edit_draw_date').value;
            const isActive = card.querySelector('.lottery_events_add_edit_is_active').checked;
            const totalTickets = card.querySelector('.lottery_events_add_edit_total_tickets').value;
            const imageFile = card.querySelector('.lottery_events_add_edit_image').files[0];                   
               // const slug = card.querySelector('.lottery_events_add_edit_slug').value;
                const miniLimit = card.querySelector('.lottery_events_add_edit_minilimit').value;
                const maxLimit = card.querySelector('.lottery_events_add_edit_maxlimit').value;
                const freePostalDescription = card.querySelector('.lottery_events_add_edit_freepostal').value;
                const competitionDetails = card.querySelector('.lottery_events_add_edit_competitiondetails').value;
    
                const formData = new FormData();
                const totalBudget = card.querySelector('.lottery_events_add_edit_total_budget').value;
            const totalAmount = card.querySelector('.lottery_events_add_edit_total_amount').value;
            const perTicketPrice = card.querySelector('.lottery_events_add_edit_per_ticket_price').value;
            const revenueType = card.querySelector('.lottery_events_add_edit_revenue_type').value;
            let revenueValue = 0;
    
    if (revenueType === 'fixed') {
        revenueValue = card.querySelector('.lottery_events_add_edit_fixed_revenue').value;
    } else if (revenueType === 'percentage') {
        revenueValue = card.querySelector('.lottery_events_add_edit_percentage_revenue').value;
    }
    
        const revenueTypeSelect = card.querySelector('.lottery_events_add_edit_revenue_type');
        const revenueTypeSpan = card.querySelector('.lottery_events_add_revenue_type');
        
    // Get all additional image files
    const additionalImages = card.querySelectorAll('input[name="additional_images[]"]');
    const additionalImageFiles = Array.from(additionalImages).map(input => input.files[0]);
    
    
            formData.append('total_budget', totalBudget);
            formData.append('revenue_type', revenueType);
            formData.append('revenue_value', revenueValue);
            formData.append('total_amount', totalAmount);
            formData.append('per_ticket_price', perTicketPrice);
            formData.append('category', categoryId);     
            formData.append('title', title);
            formData.append('description', description);
            formData.append('price', price);
            formData.append('draw_date', drawDate);
            formData.append('is_active', isActive);
            formData.append('total_tickets', totalTickets);
            if (imageFile) {
                formData.append('image', imageFile);
            }
           // formData.append('slug', slug);
            formData.append('mini_limit', miniLimit);
            formData.append('max_limit', maxLimit);
            formData.append('free_postal_description', freePostalDescription);
            formData.append('competition_details', competitionDetails);
         // Append additional images to the formData
         additionalImageFiles.forEach((imageFile, index) => {
            formData.append('additional_images[]', imageFile);
        });
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
    
                        // Update the new fields dynamically
                        card.querySelector('.lottery_events_add_total_budget').textContent = totalBudget;
                        card.querySelector('.lottery_events_add_revenue_type').textContent = revenueType;
                        card.querySelector('.lottery_events_add_total_amount').textContent = totalAmount;
                        card.querySelector('.lottery_events_add_per_ticket_price').textContent = perTicketPrice;
                        if (revenueTypeSelect.value === 'fixed') {
                            card.querySelector('.lottery_events_add_fixed_revenue span').textContent = revenueValue;
                        } else if (revenueTypeSelect.value === 'percentage') {
                            card.querySelector('.lottery_events_add_percentage_revenue span').textContent = revenueValue;
                        }
                // Update additional fields dynamically
              //  card.querySelector('.lottery_events_add_slug').textContent = slug;
                card.querySelector('.lottery_events_add_minilimit').textContent = miniLimit;
                card.querySelector('.lottery_events_add_maxlimit').textContent = maxLimit;
                card.querySelector('.lottery_events_add_freepostal').textContent = freePostalDescription;
                card.querySelector('.lottery_events_add_competitiondetails').textContent = competitionDetails;
    
    
    
                    // Update image preview if a new one was uploaded
                    if (data.image && card.querySelector('.lottery_events_add_current_image')) {
                        card.querySelector('.lottery_events_add_current_image').src = data.image;
                    } else if (data.image) {
                        const imgElement = document.createElement('img');
                        imgElement.src = data.image;
                        imgElement.className = 'lottery_events_add_current_image';
                        card.insertBefore(imgElement, card.querySelector('.lottery_events_add_edit_image'));
                    }
                    revenueTypeSpan.textContent = revenueTypeSelect.value;
                    revenueTypeSelect.style.display = 'none';
                    revenueTypeSpan.style.display = 'block';
                    // Exit edit mode
                    card.classList.remove('lottery_events_add_edit_mode');
                    lottery_events_edit_clearErrorMessages(card); // Clear errors after saving
                    alert('Lottery Event Updated Successfully');
                    fetchLotteryEvents();
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
                        fetchLotteryEvents(); 
                    } else {
                        alert('Error deleting event');
                    }
                })
                .catch(error => console.error('Error:', error));
            }
        }
        function fetchLotteryCategories() {
            fetch(get_lottery_categories_url)
                .then(response => response.json())
                .then(data => {
                    const categorySelect = document.getElementById('lottery_events_add_category');
                    categorySelect.innerHTML = '<option value="">Select Category</option>'; // Clear existing options
                    data.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        categorySelect.appendChild(option);
                    });
                })
                .catch(error => console.error('Error fetching categories:', error));
        }
      
        // Add new lottery event
        function submitAddLotteryEvent() {
            // Clear previous error messages
            clear_lottery_events_add_inputs_errors();
        
            let form = document.getElementById('addLotteryEventForm');
            let formData = new FormData(form);
        
            
        // Collect all dynamic image fields
        const additionalImagesInputs = document.querySelectorAll('input[name="additional_images[]"]'); // Ensure the name attribute is correctly set for multiple images
        additionalImagesInputs.forEach(input => {
            if (input.files) {
                for (let i = 0; i < input.files.length; i++) {
                    formData.append('additional_images', input.files[i]);
                }
            }
        });
      
            // Validation flags
            let isValid = true;
            var category = document.getElementById('lottery_events_add_category').value;       
            // Get form field values
            var totalBudget = document.getElementById('lottery_events_add_totalBudget').value;
            var totalBudgetValidationMessage = document.getElementById('lottery_events_add_budget_validation');
            var title = document.getElementsByName('title')[0].value;
            var description = document.getElementsByName('description')[0].value;
            var price = document.getElementsByName('price')[0].value;
            var drawDate = document.getElementsByName('draw_date')[0].value;
            var image = document.getElementsByName('image')[0].files[0];
            var isActive = document.getElementsByName('is_active')[0].checked;
            var perTicketPrice = document.getElementById('lottery_events_add_perTicketPrice').value;
            var freepostaldescription = document.getElementsByName('free_postal_description')[0].value;           
            // Get form field values      
            var slug = document.getElementsByName('slug')[0].value;
            var miniLimit = document.getElementsByName('mini_limit')[0].value;
            var maxLimit = document.getElementsByName('max_limit')[0].value;
            var competitionDetails = document.getElementsByName('competition_details')[0].value;
            const revenueType = document.getElementById('lottery_events_add_revenueType').value;
            const fixedRevenue = document.getElementById('lottery_events_add_fixedRevenue').value;
            const percentageRevenue = document.getElementById('lottery_events_add_percentageRevenue').value;
        
    
   // Helper function to show validation errors
function showValidationError(elementId, errorMessage) {
const errorElement = document.getElementById(elementId);
if (errorElement) {
    errorElement.textContent = errorMessage;
    errorElement.style.color = 'red'; // Optional: Add visual styling for errors
    errorElement.scrollIntoView({ behavior: 'smooth' }); // Smooth scroll to the error element
    isValid = false; // Ensure isValid is set to false
} else {
    console.error(`Element with ID "${elementId}" not found.`);
}
}

// Helper function to clear validation errors
function clearValidationError(elementId) {
const errorElement = document.getElementById(elementId);
if (errorElement) {
    errorElement.textContent = ''; // Clear the error message
}
}


// Validate Slug
if (slug && !/^[a-z0-9-]+$/.test(slug)  ) {
showValidationError('lottery_events_add_slug_validation', 'Slug must contain only lowercase letters, numbers, and hyphens.');
} else {
clearValidationError('lottery_events_add_slug_validation');
}

// Validate Minimum Tickets
if (!miniLimit || miniLimit <= 0) {
showValidationError('lottery_events_add_minilimit_validation', 'Minimum Tickets must be greater than zero.');
} else {
clearValidationError('lottery_events_add_minilimit_validation');
}

// Validate Maximum Tickets
if (!maxLimit || maxLimit <= 0 || parseInt(maxLimit) < parseInt(miniLimit)) {
showValidationError('lottery_events_add_maxlimit_validation', 'Maximum Tickets must be greater than zero and not less than Minimum Tickets.');
} else {
clearValidationError('lottery_events_add_maxlimit_validation');
}

// Validate Competition Details
if (competitionDetails.trim() === '') {
showValidationError('lottery_events_add_competitiondetails_validation', 'Competition Details cannot be empty.');
} else {
clearValidationError('lottery_events_add_competitiondetails_validation');
}

// Validate Total Budget
if (totalBudget === '' || totalBudget <= 0) {
showValidationError('lottery_events_add_budget_validation', 'Total Budget cannot be empty or zero.');
} else {
clearValidationError('lottery_events_add_budget_validation');
}

// Validate Category
if (category === '') {
showValidationError('lottery_events_add_category_validation', 'Category is required.');
} else {
clearValidationError('lottery_events_add_category_validation');
}

// Validate Title
if (title === '') {
showValidationError('lottery_events_add_title_validation', 'Title is required.');
} else {
clearValidationError('lottery_events_add_title_validation');
}

// Validate Description
if (description === '') {
showValidationError('lottery_events_add_description_validation', 'Description is required.');
} else {
clearValidationError('lottery_events_add_description_validation');
}

// Validate Price
if (price === '' || price <= 0) {
showValidationError('lottery_events_add_price_validation', 'Price must be greater than zero.');
} else {
clearValidationError('lottery_events_add_price_validation');
}

// Validate Draw Date
if (drawDate === '') {
showValidationError('lottery_events_add_drawdate_validation', 'Draw Date is required.');
} else {
clearValidationError('lottery_events_add_drawdate_validation');
}

// Validate Image
if (!image) {
showValidationError('lottery_events_add_image_validation', 'Image is required.');
} else {
clearValidationError('lottery_events_add_image_validation');
}

// Validate Per Ticket Price
if (perTicketPrice === '' || perTicketPrice <= 0) {
showValidationError('lottery_events_add_per_ticket_validation', 'Per Ticket Price must be greater than zero.');
} else {
clearValidationError('lottery_events_add_per_ticket_validation');
}

// Validate Fixed Revenue
if (revenueType === 'fixed') {
if (fixedRevenue === '' || fixedRevenue <= 0) {
    showValidationError('lottery_events_add_fixed_revenue_validation', 'Fixed Revenue Amount must be greater than zero.');
} else {
    clearValidationError('lottery_events_add_fixed_revenue_validation');
}
}

// Validate Percentage Revenue
if (revenueType === 'percentage') {
if (percentageRevenue === '' || percentageRevenue <= 0) {
    showValidationError('lottery_events_add_percentage_revenue_validation', 'Percentage Revenue Amount must be greater than zero.');
} else {
    clearValidationError('lottery_events_add_percentage_revenue_validation');
}
}      // If all fields are valid, proceed with form submission
            if (isValid) {
                // Dynamically add calculated fields to formData
                const totalAmount = document.getElementById('lottery_events_add_totalAmount').value;
                const totalTickets = document.getElementById('lottery_events_add_totalTickets').value;
                const revenueValue = revenueType === 'fixed' ? fixedRevenue : percentageRevenue;
        
                formData.append('total_amount', totalAmount);
                formData.append('total_tickets', totalTickets);
                formData.append('revenue_value', revenueValue);
                formData.append('category', category);
          
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
                        document.getElementById('additional-images-container').innerHTML = ''; // Clear additional image fields
                        document.getElementById('lotteryEventModal').style.display = 'none';
                    } else {
                        // Display validation errors
                        validate_lottery_events_add_inputs(data);
                    }
                })
                .catch(error => console.error('Error:', error));
            }
        }
         
    
    // Function to clear previous validation error messages
    function clear_lottery_events_add_inputs_errors() {
        document.getElementById('lottery_events_add_title_validation').textContent = '';
        document.getElementById('lottery_events_add_description_validation').textContent = '';
        document.getElementById('lottery_events_add_price_validation').textContent = '';
        document.getElementById('lottery_events_add_drawdate_validation').textContent = '';
        document.getElementById('lottery_events_add_image_validation').textContent = '';
        document.getElementById('lottery_events_add_isactive_validation').textContent = '';
        document.getElementById('lottery_events_add_budget_validation').textContent = '';
        document.getElementById('lottery_events_add_per_ticket_validation').textContent = '';
        document.getElementById('lottery_events_add_minilimit_validation').textContent = '';
        document.getElementById('lottery_events_add_maxlimit_validation').textContent = '';
        document.getElementById('lottery_events_add_freepostal_validation').textcontent = '';
        document.getElementById('lottery_events_add_competitiondetails_validation').textContent = '';
        document.getElementById('lottery_events_add_slug_validation').textContent = '';

    }
    
    
    
    // Function to show validation errors near each field
    function validate_lottery_events_add_inputs(errors) {
        if (errors.title) document.getElementById('lottery_events_add_title_validation').textContent = errors.title.join(', ');
        if (errors.description) document.getElementById('lottery_events_add_description_validation').textContent = errors.description.join(', ');
        if (errors.price) document.getElementById('lottery_events_add_price_validation').textContent = errors.price.join(', ');
        if (errors.draw_date) document.getElementById('lottery_events_add_drawdate_validation').textContent = errors.draw_date.join(', ');
        if (errors.image) document.getElementById('lottery_events_add_image_validation').textContent = errors.image.join(', ');
        if (errors.is_active) document.getElementById('lottery_events_add_isactive_validation').textContent = errors.is_active.join(', ');
        if (errors.slug) document.getElementById('lottery_events_add_slug_validation').textContent = errors.slug.join(', ');
        if (errors.min_limit) document.getElementById('lottery_events_add_minilimit_validation').textContent = errors.min_limit.join(', ');
        if (errors.max_limit) document.getElementById('lottery_events_add_maxlimit_validation').textContent = errors.max_limit.join(', ');
        if (errors.competition_details) document.getElementById('lottery_events_add_competitiondetails_validation').textContent = errors.competition_details.join(', ');
        if (errors.free_postal_description) document.getElementById('lottery_events_add_freepostal_validation').textContent = errors.free_postal_description.join(', ');    
    }
    

// Function to fetch lottery events data from the API
function lottery_events_fetch() {
    try {
        
        if (typeof api_get_lottery_events_url === 'undefined' || !api_get_lottery_events_url) {
            
            return; // Exit the function if the variable is not defined
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
        console.error('Unexpected error:', error);
    }
}

// Function to format the draw date
function lottery_events_formatDrawDate(drawDate) {
    const now = new Date();
    const drawDay = new Date(drawDate);

    const diffTime = drawDay - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

    return `Draw on ${drawDay.toLocaleDateString()} at ${drawDay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
// function scrollToCenterCategory() {
//     const categories = document.querySelectorAll('.category_section');
//     const centerIndex = Math.floor(categories.length / 2); // Calculate center index
//     const centerCategory = categories[centerIndex];

//     if (centerCategory) {
//         centerCategory.scrollIntoView({ behavior: 'smooth', block: 'center' });
//     }
// }
// function scrollToFirstCategory() {
//     const firstCategory = document.querySelector('.category_section'); // Get the first category section
//     if (firstCategory) {
//         firstCategory.scrollIntoView({ behavior: 'smooth', block: 'start' });
//     }
// }

function updateFavoritesCount() {
    fetch('/api/get_favorites/')
        .then(response => response.json())
        .then(data => {

            const favoritesCount = data.favorites.length;
            document.getElementById('favorites-count').innerText = favoritesCount;
        })
        .catch(error => console.error('Error fetching favorites count:', error));
}
function updateCartCount() {
    fetch('/api/get-cart/') // Fetch the updated cart data from your backend API
        .then(response => response.json())
        .then(data => {
            const cartCount = Object.keys(data).length; // Count the unique items in the cart
            document.getElementById('cart-item-count').innerText = cartCount; // Update the cart count display
        })
        .catch(error => console.error('Error fetching cart count:', error));
}

function header_navbar_fetchCategories() {
    fetch(api_get_categories_url)
        .then(response => response.json())
        .then(data => {
            header_navbar_displayCategories(data);
        })
        .catch(error => console.error('Error fetching categories:', error));
}

function header_navbar_displayCategories(categories) {
    const dropdownMenu = document.getElementById('categories_dropdown_competitions');
    categories.forEach(category => {
        const categoryLink = document.createElement('a');
        categoryLink.href = `/category_lottery_events/${category.name}/`;
        categoryLink.classList.add('dropdown-item_competitions');
        categoryLink.textContent = category.name;
        dropdownMenu.appendChild(categoryLink);
    });
}	

function scrollToFirstCategory() {
    const firstCategory = document.querySelector('.category_section'); // Get the first category section
    const categoriesTabs = document.querySelector('.categories-tabs'); // Get the categories tabs section
    const adjustheight=20;
    if (firstCategory) {
        // Scroll to position where the first category is just below the categories-tabs
        window.scrollTo({
            top: firstCategory.offsetTop - categoriesTabs.offsetHeight-adjustheight,
            behavior: 'smooth'
        });
        console.log('Scrolling to position:', firstCategory.offsetTop - categoriesTabs.offsetHeight-adjustheight);
    }
}
function populateCategoryTabs(categories) {
    const tabsContainer = document.getElementById('categories_tabs');
    tabsContainer.innerHTML = ''; // Clear the tabs container

    categories.forEach((category, index) => {
        const tab = document.createElement('button');
        tab.classList.add('category-tab');
        tab.textContent = category.name;

        if (index === 0) {
            tab.classList.add('active'); // Set the first tab as active by default
        }

        const indicator = document.createElement('div');
        indicator.classList.add('tab-indicator');
        tab.appendChild(indicator);

        tab.onclick = function () {
            // Remove active class from all tabs
            document.querySelectorAll('.category-tab').forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');

            // Scroll to the category section
            const categorySection = document.getElementById(`category_${category.id}`);
            if (categorySection) {
                categorySection.scrollIntoView({ behavior: 'smooth' });
            }
        };

        tabsContainer.appendChild(tab);
    });
}

// Function to display the lottery events
function displayLotteryEvents(events) {
    const container = document.getElementById('lottery_events_container');
    container.innerHTML = ''; // Clear the container
    if (events.length === 0) {
        container.innerHTML = '<p>No lottery events available.</p>';
        return;
    }
    // Filter out inactive events
    events = events.filter(event => event.is_active);
    // Group unique categories by ID
    const categoriesMap = {};

    events.forEach(event => {
        if (event.category && event.category.id) {
            const categoryId = event.category.id;
            const categoryName = event.category.name || 'Unknown Category';       
            if (!categoriesMap[categoryId]) {
                categoriesMap[categoryId] = { id: categoryId, name: categoryName };
            }
        }
    });


    // Convert categories map to an array and sort by ID
    const categories = Object.values(categoriesMap).sort((a, b) => a.id - b.id);

    // Populate the tabs with categories
    populateCategoryTabs(categories);

    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.id = `category_${category.id}`;
        categoryElement.classList.add('category_section');
        categoryElement.innerHTML = `<h2>${category.name}</h2>`;

        const viewAllButton = document.createElement('button');
        viewAllButton.classList.add('view_all_button');
        viewAllButton.textContent = 'View All';
        viewAllButton.onclick = function () {
            window.location.href = `/category_lottery_events/${category.name}/`;
        };
        categoryElement.appendChild(viewAllButton);

        const categoryEventsContainer = document.createElement('div');
        categoryEventsContainer.classList.add('lottery_events_displayed_container');


        // Filter events for this category
        const filteredEvents = events.filter(event =>
            event.category && event.category.id === category.id
        ).slice(0, 4);

        filteredEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.classList.add('lottery_events_event');


            const drawDateString = event.is_active
                ? lottery_events_formatDrawDate(event.draw_date)
                : 'Inactive';


            const favoriteClass = event.is_favorite ? 'favorited' : '';
            const favoriteIcon =
                `<div class="lottery_events_favorite" onclick="toggleFavorite('${event.slug}')">
                    <i class="fas fa-heart ${favoriteClass}"></i>
                </div>`;


            const enterNowButton = `<a href="/lottery_detail/${event.slug}/" class="lottery_events_enter_button">Enter now</a>`;


            eventElement.innerHTML = `
                ${favoriteIcon}
                <div class="lottery_events_event_header">${drawDateString}</div>
                ${event.image ? `<img src="${event.image}" alt="${event.title}" />` : ''}
                <h3>${event.title}</h3>
                <p><strong>Description:</strong> ${event.description}</p>
                <div class="lottery_events_price">Prize: £${event.price}</div>
                <div class="lottery_events_per_ticket_price">Per ticket price: £${event.per_ticket_price}</div>
                <div class="lottery_events_sold_percentage">
                    <div class="lottery_events_sold_bar" style="width: ${event.sold_percentage}%"></div>
                </div>
                <p>SOLD: ${event.sold_percentage}%</p>
                ${enterNowButton}
            `;


            categoryEventsContainer.appendChild(eventElement);
        });


        categoryElement.appendChild(categoryEventsContainer);
        container.appendChild(categoryElement);
    });


    attachAddToCartListeners(); // Attach listeners for "Add to Cart" buttons
}


async function fetchBanner() {
    try {
        const response = await fetch(bannerUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const bannerContainer = document.getElementById('banner_container');
        if (data.image) {
            bannerContainer.innerHTML = `
                <div class="custom-banner">
                    <div class="banner-content">
                    
                        ${data.show_title ? `<h2 class="banner-title">${data.title || 'Could you be our next winner?'}</h2>` : ''}
                        ${data.show_explore_button ? `<button class="explore-button" onclick="scrollToFirstCategory()">Explore Now</button>` : ''}
                    </div>
                    <img src="${data.image}" alt="${data.title || 'Lottery Banner'}" class="banner-image">
                <div class="banner-footer">
                <div class="banner-footer-item">
                    <i class="fas fa-trophy"></i>
                    <span>£1,833,344</span>
                    <p>Given in Prizes</p>
                </div>
                <div class="banner-footer-item">
                    <i class="fas fa-gift"></i>
                    <span>£81,567,732</span>
                    <p>Given in Prizes</p>
                </div>
                <div class="banner-footer-item">
                    <i class="fas fa-star"></i>
                    <span>Google Reviews</span>
                    <p><i class="fas fa-star"></i> 4.9</p>
                </div>
                <div class="banner-footer-item">
                    <i class="fas fa-check"></i>
                    <span>Trustpilot</span>
                    <p><i class="fas fa-star"></i> 5.0</p>
                </div>
            </div>
                    </div>
                
            `;
        } else {
            console.error('No banner data available');
            bannerContainer.innerHTML = `<p class="error-message">Unable to load banner at this time.</p>`;
        }
    } catch (error) {
        console.error('Error fetching banner:', error);
        const bannerContainer = document.getElementById('banner_container');
        bannerContainer.innerHTML = `<p class="error-message">Unable to load banner at this time.</p>`;
    }
}


async function fetchWinners_mainpage() {
    try {
        const response = await fetch(winnersUrl_mainpage);
        if (!response.ok) {
            throw new Error(`Error fetching winners: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        // Initially display the first 8 images in the order of 2, 3, 3
        const initialWinners = data.winners.slice(0, 8);
        renderWinners_mainpage(initialWinners, false, [2, 3, 3]);
    } catch (error) {
        console.error("Failed to fetch winners:", error);
    }
}

async function toggleWinners_mainpage() {
    const button = document.getElementById("view_all_button_previous_winner_mainpage");
    try {
        const response = await fetch(winnersUrl_mainpage);
        if (!response.ok) {
            throw new Error(`Error fetching winners: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (isShowingAll_previous_winner) {
            // If currently showing all, restore the initial 8 images
            const initialWinners = data.winners.slice(0, 8);
            renderWinners_mainpage(initialWinners, false, [2, 3, 3]);
            button.textContent = "View All Winners"; // Change button text
        } else {
            // Show remaining winners
            const remainingWinners = data.winners.slice(8);
            renderWinners_mainpage(remainingWinners, true, [3]); // Append in rows of 3
            button.textContent = "Show Less"; // Change button text
        }
        isShowingAll_previous_winner = !isShowingAll_previous_winner; // Toggle state
    } catch (error) {
        console.error("Failed to toggle winners:", error);
    }
}


function renderWinners_mainpage(winners, append, rowLimit) {
    const container = document.getElementById("previous_winner_section");

    if (!append) {
        container.innerHTML = ""; // Clear existing content if not appending
    }

    let rowIndex = 0;
    let count = 0;
    let row;

    winners.forEach((winner, index) => {
        if (count === rowLimit[rowIndex]) {
            rowIndex = append ? 0 : rowIndex + 1; // Reset to 0 for appending
            count = 0;
        }

        if (count === 0) {
            row = document.createElement("div");
            row.className = "previous-mainpage-winner-row";
            container.appendChild(row);
        }

        const winnerDiv = document.createElement("div");
        winnerDiv.className = "previous-mainpage-winner";
        winnerDiv.innerHTML = `
            <img src="${winner.image}" alt="${winner.name}" class="previous-mainpage-winner-image">

        `;
        row.appendChild(winnerDiv);
        count++;
    });

    // Update the displayedCount only when appending
    if (!append) {
        displayedCount_previous_winner = winners.length;
    } else {
        displayedCount_previous_winner += winners.length;
    }
}


function fetchCategoryLotteryEvents() {
    fetch(api_get_category_lottery_events_url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            displayCategoryLotteryEvents(data);
        })
        .catch(error => console.error('Error fetching category lottery events:', error));
}


function displayCategoryLotteryEvents(events) {
    console.log(events);
    const container = document.getElementById('category_lottery_events_container');
    container.innerHTML = ''; // Clear the container
    if (events.length === 0) {
        container.innerHTML = '<p>No lottery events available in this category.</p>';
        return;
    }

    events = events.filter(event => event.is_active); // Filter out inactive events

    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.classList.add('category_lottery_event');

        const drawDateString = event.is_active
            ? lottery_events_formatDrawDate(event.draw_date)
            : 'Inactive';
        const favoriteClass = event.is_favorite ? 'favorited' : '';
        const favoriteIcon = `
            <div class="lottery_events_favorite" onclick="toggleFavorite('${event.slug}')">
                <i class="fas fa-heart ${favoriteClass}"></i>
            </div>`;

        const enterNowButton = `<a href="/lottery_detail/${event.slug}/" class="category_lottery_enter_button">Enter now</a>`;

        eventElement.innerHTML = `
            ${favoriteIcon}
            <div class="category_lottery_event_header">${drawDateString}</div>
            ${event.image ? `<img src="${event.image}" alt="${event.title}" class="category_lottery_image" />` : ''}
            <h3 class="category_lottery_title">${event.title}</h3>
            <p class="category_lottery_description"><strong>Description:</strong> ${event.description}</p>
            <div class="category_lottery_price">Prize: £${event.price}</div>
            <div class="category_lottery_ticket_price">Per ticket price: £${event.per_ticket_price}</div>
            <div class="category_lottery_sold_percentage">
                <div class="category_lottery_sold_bar" style="width: ${event.sold_percentage}%"></div>
            </div>
            <p class="category_lottery_sold_text">SOLD: ${event.sold_percentage}%</p>
            ${enterNowButton}
        `;

        container.appendChild(eventElement);
    });
}


//cart.html

function addToCart(event) {
    event.preventDefault();
    const eventSlug = event.target.getAttribute('data-event-slug');
    const ticketCount = document.getElementById('lot-detail-ticket-count').value;

    fetch(add_to_carturl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({ 
            event_slug: eventSlug,
            quantity: ticketCount,
        }),
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.json().then(error => {
                throw new Error(error.message);
            });
        }
    })
    .then(data => {
        if (data.success) {
            showModal(data.message); // Show success modal
        }
    })
    .catch(error => {
        showModal(error.message); // Show error modal
        console.error('Error adding to cart:', error);
    });
}

// Show modal function
function showModal(message) {
    const modal = document.getElementById('cart-modal');
    const modalMessage = document.getElementById('cart-modal-message');
    
    modalMessage.textContent = message;
    modal.classList.remove('hiddencart');
    modal.style.display = 'flex';
    
    // Close modal when clicking the close button (X)
    const closeButton = document.querySelector('.cart-modal-close');
    closeButton.addEventListener('click', () => {
        closeModal(modal);
    });

    // Close modal when clicking outside the modal content
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });

    // Keep Shopping Button
    const keepShoppingButton = document.getElementById('cart-keep-shopping');
    keepShoppingButton.addEventListener('click', () => {
        closeModal(modal);
    });

    // View Cart Button
    const viewCartButton = document.getElementById('cart-view-cart');
    viewCartButton.addEventListener('click', () => {
        window.location.href = cartUrl;
    });
}

// Close modal function
function closeModal(modal) {
    modal.style.display = 'none';
}

// Utility function to get CSRF token
function getCSRFToken() {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}

// Function to attach "Add to Cart" event listeners dynamically
function attachAddToCartListeners() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-button');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart);
    });
}

// Call functions on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lottery_events_fetch === 'function') {
        lottery_events_fetch(); // Fetch and display lottery events if applicable
    }
    attachAddToCartListeners(); // Attach listeners to "Add to Cart" buttons
});

//finish

// Function to fetch cart items
function fetchCartItems() {
    fetch(api_get_cart_url)
        .then(response => response.json())
        .then(data => {
            displayCartItems(data);
        })
        .catch(error => {
            console.error('Error fetching cart items:', error);
        });
}


function displayCartItems(cart) {
    const container = document.getElementById('cart_items_container');
    const totalElement = document.getElementById('cart_total');
    container.innerHTML = ''; // Clear existing items
    let total = 0;

    if (Object.keys(cart).length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        totalElement.textContent = '0.00';
        return;
    }

    for (const [eventSlug, item] of Object.entries(cart)) {
        const itemTotal = parseFloat(item.per_ticket_price) * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.classList.add('cart_item');

        cartItem.innerHTML = `
            ${item.image ? `<img src="${item.image}" alt="${item.title}" style="width: 100px; height: auto;" />` : ''}
            <h3>${item.title}</h3>
            <p>Price: £${item.per_ticket_price}</p>
            <p>Quantity: 
                <button class="quantity-decrease" data-event-slug="${eventSlug}">-</button>
                <input type="number" min="1" max="${item.max_limit}" value="${item.quantity}" class="quantity-input" data-event-slug="${eventSlug}" />
                <button class="quantity-increase" data-event-slug="${eventSlug}">+</button>
            </p>
            <span class="max-limit-message"></span> <!-- Message span -->
            <p>Total: £${itemTotal.toFixed(2)}</p>
            <button class="remove_from_cart_button" data-event-slug="${eventSlug}">Remove</button>
        `;

        container.appendChild(cartItem);
    }

    totalElement.textContent = total.toFixed(2);
    const removeButtons = document.querySelectorAll('.remove_from_cart_button');
   removeButtons.forEach(button => {
       button.addEventListener('click', removeFromCart);
 });
    
    attachCartEventListeners(cart); // Attach listeners for quantity changes and remove buttons

    // Add focus-out event listener for quantity inputs
    const quantityInputs = container.querySelectorAll('.quantity-input');
    quantityInputs.forEach(input => {
        input.addEventListener('blur', event => {
            const eventSlug = event.target.getAttribute('data-event-slug');
            const newQuantity = parseInt(event.target.value);
            const maxLimit = parseInt(event.target.getAttribute('max'));

            const parentElement = event.target.closest('.cart_item');
            const messageSpan = parentElement.querySelector('.max-limit-message');

            if (newQuantity > maxLimit) {
                event.target.value = '';
                messageSpan.textContent = `Exceeds max limit of ${maxLimit}. Please enter a valid quantity.`;
                //event.target.value = maxLimit; // Reset to max limit
                //messageSpan.textContent = `Max limit of ${maxLimit} reached.`;
                messageSpan.style.color = 'red';
                messageSpan.style.fontSize = '12px';
            } else if (newQuantity < 1) {
                event.target.value = 1; // Reset to minimum limit
            } else {
                messageSpan.textContent = ''; // Clear message
                updateCartQuantity(event, cart, newQuantity - cart[eventSlug].quantity);
            }
        });
    });
    
}

function attachCartEventListeners(cart) {
    const increaseButtons = document.querySelectorAll('.quantity-increase');
    const decreaseButtons = document.querySelectorAll('.quantity-decrease');

    increaseButtons.forEach(button => {
        button.addEventListener('click', event => updateCartQuantity(event, cart, 1));
    });

    decreaseButtons.forEach(button => {
        button.addEventListener('click', event => updateCartQuantity(event, cart, -1));
    });
}


function updateCartQuantity(event, cart, delta) {
    const eventSlug = event.target.getAttribute('data-event-slug');
    const currentQuantity = parseInt(cart[eventSlug].quantity);
    const maxLimit = parseInt(cart[eventSlug].max_limit);
    const newQuantity = currentQuantity + delta;

    // Get the parent element of the button
    const parentElement = event.target.closest('.cart_item');
    const messageSpan = parentElement.querySelector('.max-limit-message');

    if (newQuantity > maxLimit) {
        // Show max limit message
        if (messageSpan) {
            messageSpan.textContent = `Max limit of ${maxLimit} reached.`;
            messageSpan.style.color = "red"; // Highlight in red
            messageSpan.style.fontSize = "12px"; // Adjust font size
        }
        return;
    } else if (messageSpan) {
        // Clear message if within limit
        messageSpan.textContent = '';
    }

    if (newQuantity >= 1) {
        cart[eventSlug].quantity = newQuantity;

        // Update cart cookie
        fetch('/api/update-cart/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({ event_slug: eventSlug, quantity: newQuantity }),
        }).then(() => fetchCartItems());
    }
}

// Function to handle item removal from cart
function removeFromCart(event) {
    const eventSlug = event.target.getAttribute('data-event-slug');

    fetch('/api/remove-from-cart/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({ event_slug: eventSlug }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Item removed from cart!');
                fetchCartItems(); // Refresh cart items
            } else {
                alert('Failed to remove item. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error removing item:', error);
        });
}

// Dummy function for checkout (implement backend logic as needed)
function proceedToCheckout() {
    alert('Proceeding to checkout...');
}


//lottery_detail.html

/*-------------------lottery_details-----------------------------------*/
fetch(`/api/lottery_detail/${eventSlug}/`)
.then((response) => response.json())
.then((data) => {
    // DOM elements for event details
    const additionalImagesContainer = document.getElementById("additional-images-containerpopup");
    const popup = document.getElementById("lot-detail-image-popup");
    const popupImage = document.getElementById("lot-detail-popup-image");
    const closePopup = document.getElementById("lot-detail-close-popup");
    const prevImageBtn = document.getElementById("lot-detail-prev-image");
    const nextImageBtn = document.getElementById("lot-detail-next-image");
    const currentIndexSpan = document.getElementById("lot-detail-current-image-index");
    const totalImagesSpan = document.getElementById("lot-detail-total-images");
    const eventImage = document.getElementById("lot-detail-event-image");
    const competitionDetailsList = document.getElementById("lot-detail-competition-list");
    const ticketSlider = document.getElementById('lot-detail-ticket-slider');
    const ticketInput = document.getElementById('lot-detail-ticket-count');

    let currentIndex = 0;

    /*------- Populate lottery event details----------*/
    document.getElementById('lot-detail-event-title').textContent = data.title;
    document.getElementById('lot-detail-event-description').textContent = data.description;
    document.getElementById('lot-detail-event-price').textContent = `Prize:£${data.price}`;
    document.getElementById('lot-detail-event-per-ticket-price').textContent = `per ticket price: £${data.per_ticket_price}`;
    document.getElementById('event-sold-percentage').textContent = `Sold: ${data.sold_percentage}%`;
    document.getElementById('lot-detail-free-postal-description').textContent = data.free_postal_description;
   
    document.getElementById('lot-detail-ticket-info').textContent = `${data.sold_tickets}/${data.total_tickets}`;
    document.getElementById('lot-detail-sold-bar-fill').style.width = `${data.sold_Percentage}%`;
   
    const formattedDrawDate = lottery_events_formatDrawDate(data.draw_date);
    document.getElementById('lot-detail-event-draw-datetime').textContent = formattedDrawDate;

    /*-----------Update the primary event image-------------*/
    eventImage.src = data.image;

    

/*----------------- Populate additional images-----------------*/
if (data.additional_images && data.additional_images.length > 0) {
    data.additional_images.forEach((img) => {
        const imgElement = document.createElement("img");
        imgElement.src = img.image;
        imgElement.alt = "Additional Image";
        imgElement.classList.add("lot-detail-additional-image");
        additionalImagesContainer.appendChild(imgElement);
    });

    const additionalImages = document.querySelectorAll(".lot-detail-additional-image");

    /*------------Show popup with the clicked image---------*/
    const showPopup = (index) => {
        currentIndex = index;
        popupImage.src = additionalImages[currentIndex].src;
        currentIndexSpan.textContent = currentIndex + 1;
        totalImagesSpan.textContent = additionalImages.length;
        popup.classList.remove("hidden");
    };

    additionalImages.forEach((image, index) => {
        image.addEventListener("click", () => showPopup(index));
    });

    closePopup.addEventListener("click", () => {
        popup.classList.add("hidden");
    });

    nextImageBtn.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % additionalImages.length;
        showPopup(currentIndex);
    });

    prevImageBtn.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + additionalImages.length) % additionalImages.length;
        showPopup(currentIndex);
    });

    popup.addEventListener("click", (e) => {
        if (e.target === popup) {
            popup.classList.add("hidden");
        }
    });
} else {
    console.warn("No additional images found for this event.");
}

   
       /*--------------------Populate competition details--------------*/ 
if (data.competition_details && data.competition_details.trim() !== "") {
    // Split the text by a delimiter (e.g., newline or comma)
    const details = data.competition_details.split("\n"); // Assuming details are separated by newlines

    details.forEach((detail) => {
        if (detail.trim() !== "") { // Ignore empty lines
            const listItem = document.createElement("li");
            listItem.textContent = detail.trim();
            competitionDetailsList.appendChild(listItem);
        }
    });
} else {
    competitionDetailsList.textContent = "No competition details available.";
}
 
    $(document).ready(function () {
        // Handle tab navigation
        $('.lot-detail-tab-btn').on('click', function () {
            const tabId = $(this).data('tab');
    
            // Highlight the active tab button
            $('.lot-detail-tab-btn').removeClass('active');
            $(this).addClass('active');
    
            // Show the active tab content
            $('.lot-detail-tab-pane').removeClass('active');
            $(`#${tabId}`).addClass('active');
        });
        const miniLimit = data.mini_limit; // backend mini limit
                 const maxLimit = data.max_limit;
        
        
                document.getElementById('lot-detail-ticket-max-limit').textContent = maxLimit;
        
        
                ticketSlider.min = 1; // frontend minimum is 1
                ticketSlider.max = maxLimit;
                ticketSlider.value = miniLimit; // set the slider value to backend mini limit
                ticketInput.value = miniLimit; // set the input value to backend mini limit
        
        
                // Update slider and ticket input
                ticketSlider.addEventListener("input", () => {
                    ticketInput.value = ticketSlider.value;
                });
        
        
                // Increment ticket count
                document.getElementById('lot-detail-increment-ticket').addEventListener("click", () => {
                    const currentValue = parseInt(ticketInput.value);
                    if (currentValue < maxLimit) {
                        ticketInput.value = currentValue + 1;
                        ticketSlider.value = currentValue + 1;
                    }
                });
        
        
                // Decrement ticket count
                document.getElementById('lot-detail-decrement-ticket').addEventListener("click", () => {
                    const currentValue = parseInt(ticketInput.value);
                    if (currentValue > 1) {
                        ticketInput.value = currentValue - 1;
                        ticketSlider.value = currentValue - 1;
                    }
                });
            })
        });

//favorite.html

// Function to fetch the list of favorite events from the server
function fetchFavorites() {
    fetch('/api/get_favorites/')
        .then(response => response.json())
        .then(data => {
            displayFavorites(data.favorites);
        })
        .catch(error => console.error('Error fetching favorites:', error));
}


// Function to display the favorites
function displayFavorites(favorites) {
    const container = document.getElementById('favorites_container');
    container.innerHTML = ''; // Clear the container before rendering

    if (favorites.length === 0) {
        container.innerHTML = '<p>No favorites added yet.</p>';
        return;
    }

    favorites.forEach(event => {
        const favoriteElement = document.createElement('div');
        favoriteElement.classList.add('favorite_event');
        // Format the draw date using the lottery_events_formatDrawDate function
        const formattedDrawDate = lottery_events_formatDrawDate(event.draw_date);
        const favoriteClass = event.is_favorite ? 'favorited' : '';
        const favoriteIcon = `
            <div class="lottery_events_favorite" onclick="toggleFavorite('${event.slug}')">
                <i class="fas fa-heart ${favoriteClass}"></i> 
            </div>`;
    
        // Create the content for each favorite event
        const favoriteContent = `
            ${favoriteIcon}
            <p>${formattedDrawDate}</p>
            <h3>${event.title}</h3>
            <p><strong>Description:</strong> ${event.description}</p>
            <div class="lottery_events_price">Prize: £${event.price}</div>
            <div class="lottery_events_per_ticket_price">Per ticket price: £${event.per_ticket_price}</div>
            <div class="lottery_events_sold_percentage">
                <div class="lottery_events_sold_bar" style="width: ${event.sold_percentage}%"></div>
            </div>
            <p>SOLD: ${event.sold_percentage}%</p>
            
            ${event.image ? `<img src="${event.image}" alt="${event.title}" style="width: 150px; height: 100px; object-fit: cover;" />` : ''}
            <a href="${event.enter_now_button}" class="lottery_events_enter_button">Enter now</a>
            
        `;

        // Set the inner HTML for the favorite element
        favoriteElement.innerHTML = favoriteContent;

        // Append the favorite element to the container
        container.appendChild(favoriteElement);
    });
}

function toggleFavorite(eventSlug) {
    const favoriteIcon = document.querySelector(`#favorite-icon-${eventSlug}`);
    fetch('/api/add_to_favorites/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "X-CSRFToken": add_csrftoken
        },
        body: JSON.stringify({ event_slug: eventSlug }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        updateFavoritesCount()
        fetchFavorites(); // Refresh the favorites list
        lottery_events_fetch();
        fetchCategoryLotteryEvents();
        // Toggle the class on the icon based on the response
        if (data.success) {
            favoriteIcon.classList.toggle('favorited'); // Add or remove 'favorited' class
        }
    })
    .catch(error => console.error('Error toggling favorite:', error));
}

