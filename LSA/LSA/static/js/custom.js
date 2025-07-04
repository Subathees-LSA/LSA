//    custom_admin_dashboard.html (adminpanel template)
//    AdminReply,Contact table (models.py)
//    UserChatView function (views.py)
//ID:LP-I81-start
function user_chat_view() {
    const user_chats_message_list = document.getElementById("user_chats_message_list");
    const messageInput = document.getElementById("user_chats_message_input");
    const fileInput = document.getElementById("user_chats_file_input");
    const sendButton = document.getElementById("user_chats_send_button");
    const errorMessage = document.getElementById("user_chats_error_message");

    const fetchChats = () => {
        fetch("/api/user/chat/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`, 
            },
        })
            .then((response) => response.json())
            .then((data) => {
                user_chats_message_list.innerHTML = "";
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
                    user_chats_message_list.appendChild(messageItem);
                });
            })
            .catch((error) => console.error("Error fetching chats:", error));
    };

 
    const sendMessage = () => {
        const message = messageInput.value.trim();
        const file = fileInput.files[0];

        errorMessage.innerText = "";

        if (!message && !file) {
           
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
                "X-CSRFToken": user_chats_csrfToken 
            },
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message) {
                    messageInput.value = ""; 
                    fileInput.value = "";
                    errorMessage.innerText = "";
                    fetchChats(); 
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
  
    fetchChats();
}
//ID:LP-I81-End
//    custom_admin_dashboard.html (adminpanel template)
//    Contact table (models.py)
//    ContactListView function (views.py)
//ID:LP-I81-start
function admin_chat_view() {
    const userChat_Icons = document.getElementById("userChat_Icons");
    const specfic_user_chats = document.getElementById("specfic_user_chats");
    const all_users_name = document.getElementById("all_users_name");

    const backButton = document.createElement("button");
    backButton.id = "admin_contact_reply_back_button";
    backButton.innerText = "Back";
    backButton.style.display = "none"; 
    backButton.onclick = () => showEmailList();

    const basketIcon = document.createElement("span");
    basketIcon.id = "basket-icon";
    basketIcon.title = "Delete Selected";
    basketIcon.innerHTML = "🗑️";
    basketIcon.style.display = "none"; 
    basketIcon.style.cursor = "pointer";
    basketIcon.style.fontSize = "20px";
    basketIcon.style.marginBottom = "10px";
    basketIcon.onclick = () => deleteSelectedContacts();

    
    document.querySelector(".delete_Container").prepend(basketIcon);


    let selectedEmails = [];

    fetch("/api/admin/messages/")
        .then((response) => response.json())
        .then((data) => {
            const sortedEmails = Object.entries(data);

            sortedEmails.forEach(([email, messages]) => {
                let user_name;

                messages.forEach((message) => {
                    user_name = message.name;
                    starred = message.starred; 
    
                });

                const emailItem = document.createElement("div");
                emailItem.className = "email-item";
                emailItem.setAttribute("data-email", `${email}`);
                emailItem.innerHTML = `
                <input type="checkbox" class="email-checkbox" data-email="${email}">
                <span class="email-text">${email}</span>
                <span class="last-message"></span>
                <span class="delete-icon" title="Delete Email">🗑️</span>
                <span class="starred_chat">${starred ? "⭐" : ""}</span>
            `;
                const customer_support_page_users_email_span = emailItem.querySelector(".email-text");
                const customer_support_page_users_email_span_value = `${email}`;
                customer_support_page_users_email_span.innerText = `${email}`;
                if (customer_support_page_users_email_span_value.length > 13) {
                customer_support_page_users_email_span.innerText = `${email.substring(0, 13)}...`;
                }
                const lastMessageElement = emailItem.querySelector(".last-message");
                 //    custom_admin_dashboard.html (adminpanel template)
                //    AdminReply,Contact table (models.py)
                //    ChatMessagesView function (views.py)
                fetch(`/api/admin/chat/${email}/`)
                    .then((response) => response.json())
                    .then((messages) => {
                        const lastMessage = messages[messages.length - 1];

                        const lastMessageContent = lastMessage?.file
                            ? "File Attached" 
                            : lastMessage?.message || "No message"; 
                        lastMessageElement.innerText = `${lastMessageContent}`;
                        if (lastMessageContent.length > 15) {
                            lastMessageElement.innerText = `${lastMessageContent.substring(0, 15)}...`;
                        }
                    })
                    .catch((error) => console.error("Error fetching messages by email:", error));

              
                emailItem.querySelector(".email-checkbox").onclick = (e) => handleCheckboxSelection(e, email);

                
                emailItem.querySelector(".delete-icon").onclick = () => deleteContact(email);

                const activateEmailItem = () => {
                  
                    document.querySelectorAll(".email-item").forEach((item) => {
                        item.classList.remove("active");
                    });
        
                  
                    emailItem.classList.add("active");
        
                  
                    fetchMessagesByEmail(email);
                };
        
                emailItem.querySelector(".email-text").onclick = activateEmailItem;
                emailItem.querySelector(".last-message").onclick = activateEmailItem;

                emailItem.onclick = (e) => {
                    const target = e.target;
                    if (!target.classList.contains("email-checkbox") && !target.classList.contains("delete-icon")) {
                        activateEmailItem();
                    }
                };

              
                all_users_name.appendChild(emailItem);

            });
        })
        .catch((error) => console.error("Error fetching messages:", error));
    //    custom_admin_dashboard.html (adminpanel template)
    //    AdminReply table (models.py)
    //    EditdeleteAdminReplyView function (views.py)
    const editAdminMessage = (id, oldMessage) => {
      
        const modal = document.getElementById("admin_contact_reply_editMessageModal");
        const editMessageInput = document.getElementById("admin_contact_reply_editMessageInput");
        const editMessageFile = document.getElementById("admin_contact_reply_editMessageFile");
        const editMessageForm = document.getElementById("admin_contact_reply_editMessageForm");

        editMessageInput.value = oldMessage;
        editMessageFile.value = "";
        modal.style.display = "block";

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
                    "X-CSRFToken": admin_chats_csrfToken 
                },
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.message) {
                        alert(data.message);
                        modal.style.display = "none"; 
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

    document.getElementById("admin_contact_reply_closeEditModal").onclick = () => {
        document.getElementById("admin_contact_reply_editMessageModal").style.display = "none";
    };

    window.onclick = (event) => {
        const modal = document.getElementById("admin_contact_reply_editMessageModal");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    //    custom_admin_dashboard.html (adminpanel template)
    //    AdminReply table (models.py)
    //    EditdeleteAdminReplyView function (views.py)
    const deleteAdminMessage = (id) => {
        if (confirm("Are you sure you want to delete this message?")) {
            fetch(`/api/admin/reply/${id}/edit_delete/`, {
                method: "DELETE",
                headers: {
                    "X-CSRFToken": admin_chats_csrfToken 
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
    const fetchUserName = (email) => {
        const user_Icon = document.createElement("span");
        user_Icon.className = "user-Icon";
        user_Icon.style.cursor = "pointer";
        user_Icon.style.fontSize = "20px";
        user_Icon.style.marginRight = "16px";
        let CurrentUserId = document.getElementById('Chat_UserId');

        const email_items = document.querySelectorAll(`[data-email="${email}"]`);
        email_items.forEach((item) => {
            let userName = item.nextElementSibling.innerHTML;
            CurrentUserId.value = userName;
            user_Icon.textContent = userName;
        });

        if (user_Icon.textContent == '') {
            user_Icon.textContent = CurrentUserId.value; 
        }
        userChat_Icons.appendChild(user_Icon);
    };
    const fetchMessagesByEmail = (email) => {
        const all_users_searchEmail = document.getElementById("searchEmail");
        
        function hide_and_unhide_user_chat_on_mobile() {
            const all_users_name = document.getElementById("all_users_name");
            const user_specfic_chat = document.getElementById("user_specfic_chat");
        
            if (window.matchMedia("(max-width: 768px)").matches) {
                
                all_users_name.style.display = "none";
                all_users_searchEmail.style.display = "none";
                user_specfic_chat.style.display = "block";
            } else {
              
                all_users_name.style.display = "block"; 
                user_specfic_chat.style.display = "block";
                all_users_searchEmail.style.display = "block";
            }
        }
        
      
        hide_and_unhide_user_chat_on_mobile();
        
        
        window.addEventListener("resize", hide_and_unhide_user_chat_on_mobile);
        
      
        window.addEventListener("popstate", function () {
            if (window.innerWidth <= 768) { 
                document.getElementById("all_users_name").style.display = "block";
                document.getElementById("user_specfic_chat").style.display = "none";
                all_users_searchEmail.style.display = "block";
            }
        });
        
        // When navigating to chat, push state to history
        function showUserChat() {
            if (window.innerWidth <= 768) { 
                document.getElementById("all_users_name").style.display = "none";
                all_users_searchEmail.style.display = "none";
                document.getElementById("user_specfic_chat").style.display = "block";
                history.pushState(null, null, location.href);
            }
        }
        showUserChat()
        //    custom_admin_dashboard.html (adminpanel template)
        //    Contact table (models.py)
        //    mark_messages_as_read function (views.py)
    
        fetch(`/api/mark-read/${email}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": admin_chats_csrfToken
            }
        })
            .then((response) => {
                if (!response.ok) {
                    console.log("Failed to mark messages as read");
                }
                console.log("Messages marked as read.");
            })
            .catch((error) => console.error("Error marking messages as read:", error));
         //    custom_admin_dashboard.html (adminpanel template)
    //    AdminReply,Contact table (models.py)
    //    ChatMessagesView function (views.py)    
        fetch(`/api/admin/chat/${email}/`)
            .then((response) => response.json())
            .then((messages) => {
                userChat_Icons.innerHTML = "";
                specfic_user_chats.innerHTML = "";
                backButton.style.display = "block";
               
               
                document.getElementById("user_email").innerText = email;
                /* On Clicking Individual User, Reset Previous Users Form and Response Message */
                let current_Email = document.getElementById('admin_contact_reply_email').value;
                if(current_Email!==email){
                const responseMessage = document.getElementById("admin_contact_reply_response_message");
                responseMessage.innerText='';
                const admin_contact_reply_form = document.getElementById('admin_contact_reply_form');
                admin_contact_reply_form.reset(); 
                }

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
                userChat_Icons.appendChild(starContainer);
              

                messages.forEach((message) => {

                    const messageItem = document.createElement("div");
                    messageItem.className = message.type === "user" ? "chat-user-message" : "chat-admin-message";
                    if (message.type === "user") {
                      
                        starIcon.innerHTML = message.starred ? "⭐" : "☆"; 

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
                    if (message.type === "admin") {
                        const actions = document.createElement("div");
                        actions.className = "message-actions";

                        const editIcon = document.createElement("span");
                        editIcon.innerHTML = "✏️";
                        editIcon.title = "Edit Message";
                        editIcon.onclick = () => editAdminMessage(message.id, message.message);

                        const deleteIcon = document.createElement("span");
                        deleteIcon.innerHTML = "🗑️"; 
                        deleteIcon.title = "Delete Message";
                        deleteIcon.onclick = () => deleteAdminMessage(message.id);

                        actions.appendChild(editIcon);
                        actions.appendChild(deleteIcon);
                        messageItem.appendChild(actions);
                    }
                    specfic_user_chats.appendChild(messageItem);
                });
                /** Delete The User Related Notification Messages in Notification Popup*/
                let userName = email.substring(0, email.indexOf("@"));
                let notification_msg = document.getElementById(`${userName}`);
                if (notification_msg !== null) {
                    notification_msg.remove();
                }
                /** Fetch Notification popup Messages Per click */
                const notificationSection = document.getElementById("notification-section");
                let setCount = notificationSection.childElementCount; 
                const notificationCount = document.getElementById("notification-count");
                notificationCount.textContent = setCount;

                openReplyForm(email);
                specfic_user_chats_autoScroll();
                function specfic_user_chats_autoScroll() {
                    specfic_user_chats.scrollTop = specfic_user_chats.scrollHeight;
                }
                function showSelectedFileOnCustomerSupportPage(){
                    const fileInput = document.getElementById('admin_contact_reply_file');
                    const fileNameDisplay = document.getElementById('file-name');
                    const sendReplyBtn = document.getElementById('send-reply-btn');
                
                    fileInput.addEventListener('change', function () {
                    if (this.files.length > 0) {
                        fileNameDisplay.textContent = `Selected: ${this.files[0].name}`;
                    }
                    });
                
                    sendReplyBtn.addEventListener('click', function () {
                    fileNameDisplay.textContent = ''; 
                    });
                }
                showSelectedFileOnCustomerSupportPage();
            })
            .catch((error) => console.error("Error fetching messages by email:", error));
    };
    function setActiveEmail(email) {
    // Get all elements with the class 'email-item' inside 'all_users_name'
    const allItems = document.querySelectorAll('#all_users_name .email-item');

    allItems.forEach(item => {
        // Check if the data-email attribute matches the passed email
        if (item.getAttribute('data-email') === email) {
            item.classList.add('active'); // Add 'active' class
        } else {
            item.classList.remove('active'); // Remove from others
        }
    });
}

    function user_NotificationsMsg(emailid) {
        user_notifications();
        fetchMessagesByEmail(emailid)
        setActiveEmail(emailid);
        const notificationPopup_chat = document.getElementById("notification-popup");
        notificationPopup_chat.style.display = "none";
        showSpecificDiv('admin_reply_chat_bot');
        $(".sidebars").removeClass('active');
        $("#admin_reply_chat_bot_navbar").addClass('active');
        hidetoggleSidebar();
    }
    //    custom_admin_dashboard.html (adminpanel template)
    //    Contact table (models.py)
    //    latest_unread_notifications function (views.py)
    function user_notifications() {
        const notificationCount = document.getElementById("notification-count");
        const notificationSection = document.getElementById("notification-section");
        const noNotificationsMsg = document.getElementById("no-notifications");
        let current_Count = document.querySelector('#notification-count').innerText;
        notificationSection.innerHTML = ""
        fetch("/api/latest-unread-notifications/")
            .then(response => response.json())
            .then(notifications => {
                if (current_Count==='0' && notifications.length === 0) {
                    noNotificationsMsg.style.display = "block";
                    notificationCount.textContent = "0";
                    document.getElementById("notification_img").style.opacity = "0.4";
                    document.getElementById("notification-count").style.backgroundColor = "#cdc8c8";
                } else {
                    noNotificationsMsg.style.display = "none";
                    notificationCount.textContent = current_Count === '0'? current_Count=notifications.length : current_Count;


                    notifications.forEach(notification => {
                        const notificationItem = document.createElement("div");
                        let userName = notification.email.substring(0, notification.email.indexOf("@"));
						notificationItem.setAttribute("id", userName);
                        notificationItem.className = "notification-item";
                        notificationItem.innerHTML = `
                            <strong>${notification.email}</strong>
                            <p>${notification.description}</p>
                            <small>${new Date(notification.created_at).toLocaleString()}</small>
                        `;
                        notificationItem.onclick = () => user_NotificationsMsg(notification.email);
                        notificationSection.appendChild(notificationItem);
                    });
                }
            })
            .catch(error => console.error("Error fetching notifications:", error));
    }
    user_notifications();
    function display_notificationPopup() {
        const notificationBell = document.getElementById("notification-bell");
        const notificationPopup = document.getElementById("notification-popup");
        
        notificationBell.addEventListener("click", function(event) {
            const computedStyle = window.getComputedStyle(notificationPopup);
            if (computedStyle.display === "none") {
                notificationPopup.style.display = "block"; 
            } else if (computedStyle.display === "block") {
                notificationPopup.style.display = "none";
            } else {
                notificationPopup.style.display = "none"; 
            }
            event.stopPropagation();
        });
            document.addEventListener('click', function(event) {
            if (!notificationPopup.contains(event.target)) {
                notificationPopup.style.display = 'none';
            }
        });
    }
    display_notificationPopup();
    const toggleStarChat = (email, starIcon) => {
        const isStarred = starIcon.innerHTML === "⭐";
        fetch("/api/admin/messages/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": admin_chats_csrfToken
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
     //    custom_admin_dashboard.html (adminpanel template)
    //    AdminReply,Contact table (models.py)
    //    DeleteContactView function (views.py)
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
                        let current_Email = document.getElementById('admin_contact_reply_email').value;
                        if (email !== current_Email) { 
                            fetchMessagesByEmail(current_Email);
                            showEmailList(); 
                        }
                        else {
                            document.getElementById('Chat_UserId').value = '';
                            document.getElementById("user_email").innerText = "";
                            showEmailList();
                        }
                        const admin_customer_support_page_searchInput = document.getElementById("searchEmail");
                        if (admin_customer_support_page_searchInput) {
                            admin_customer_support_page_searchInput.value = "";
                        }
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

        basketIcon.style.display = selectedEmails.length > 0 ? "inline-block" : "none";
    };
    //    custom_admin_dashboard.html (adminpanel template)
    //    AdminReply,Contact table (models.py)
    //    DeleteContactView function (views.py)
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
                    let current_Email = document.getElementById('admin_contact_reply_email').value;

                    if (selectedEmails.includes(current_Email)) {
                        selectedEmails = [];
                        document.getElementById('Chat_UserId').value = ''; 
                        
                        document.getElementById("user_email").innerText = "";
                        showEmailList();
                    }
                    else {
                        fetchMessagesByEmail(current_Email);
                        showEmailList(); 
                    }
                    const selectedEmails_admin_customer_support_page_searchInput = document.getElementById("searchEmail");
                    if (selectedEmails_admin_customer_support_page_searchInput) {
                        selectedEmails_admin_customer_support_page_searchInput.value = "";
                    }
                })
                .catch((error) => {
                    console.error("Error deleting selected contacts:", error);
                    alert("Error deleting selected contacts.");
                });
        }
    };
     //    custom_admin_dashboard.html (adminpanel template)
    //    AdminReply,Contact table (models.py)
    //    ChatMessagesView function (views.py)
    const showEmailList = () => {
        all_users_name.innerHTML = "";
        specfic_user_chats.innerHTML = "";
        userChat_Icons.innerHTML = "";
        backButton.style.display = "none";
        basketIcon.style.display = "none"; 
        const replyForm = document.getElementById("admin_contact_reply_form_container");
        replyForm.style.display = "none";

        fetch("/api/admin/messages/")
            .then((response) => response.json())
            .then((data) => {
                const sortedEmails = Object.entries(data);

                sortedEmails.forEach(([email, messages]) => {
                    let user_name;

                    messages.forEach((message) => {
                        user_name = message.name;
                    });
                    const emailItem = document.createElement("div");
                    emailItem.className = "email-item";
                    emailItem.innerHTML = `
                <input type="checkbox" class="email-checkbox" data-email="${email}">
                <span class="email-text">${email}</span>
                <span class="last-message"></span>
                <span class="delete-icon" title="Delete Email">🗑️</span>
            `;
                    const lastMessageElement = emailItem.querySelector(".last-message");
                    //    custom_admin_dashboard.html (adminpanel template)
                    //    AdminReply,Contact table (models.py)
                    //    ChatMessagesView function (views.py)
                    fetch(`/api/admin/chat/${email}/`)
                        .then((response) => response.json())
                        .then((messages) => {
                            const lastMessage = messages[messages.length - 1];

                            const lastMessageContent = lastMessage?.file
                                ? "File Attached" 
                                : lastMessage?.message || "No message"; 
                            lastMessageElement.innerText = `${lastMessageContent}`;
                            if (lastMessageContent.length > 5) {
                                lastMessageElement.innerText = `${lastMessageContent.substring(0, 5)}...`;
                            }
                        })
                        .catch((error) => console.error("Error fetching messages by email:", error));



                    emailItem.querySelector(".email-checkbox").onclick = (e) => handleCheckboxSelection(e, email);

                    emailItem.querySelector(".delete-icon").onclick = () => deleteContact(email);

                    emailItem.querySelector(".email-text").onclick = () => fetchMessagesByEmail(email);
                    emailItem.onclick = (e) => {
                        const target = e.target;
                        if (!target.classList.contains("email-checkbox") && !target.classList.contains("delete-icon")) {
                        fetchMessagesByEmail(email);
                        }
                    };

                    all_users_name.appendChild(emailItem);


                });
            })
            .catch((error) => console.error("Error fetching messages:", error));

    };

    const openReplyForm = (email) => {
        const replyForm = document.getElementById("admin_contact_reply_form_container");
        replyForm.style.display = "block";
        document.getElementById("admin_contact_reply_email").value = email;
    };



     //    custom_admin_dashboard.html (adminpanel template)
    //    AdminReply,Contact table (models.py)
    //    AdminReplyView function (views.py)
    document.getElementById("admin_contact_reply_form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("admin_contact_reply_email").value;
        const replyMessage = document.getElementById("admin_contact_reply_message").value.trim();
        const adminreplyMessage = document.getElementById("admin_contact_reply_message")
        const fileInput = document.getElementById("admin_contact_reply_file");
        const responseMessage = document.getElementById("admin_contact_reply_response_message");

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
                adminreplyMessage.value = ""; 
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
}

function filterEmails() {
    const searchInput = document.getElementById("searchEmail").value.toLowerCase();
    const emailItems = document.querySelectorAll(".email-item");
    const noUsersMsg = document.getElementById("noUsersMsg");

    let visibleCount = 0;

    emailItems.forEach((item) => {
        const admin_customer_support_page_checkbox = item.querySelector(".email-checkbox");
        const admin_customer_support_page_emailData = admin_customer_support_page_checkbox.getAttribute("data-email").toLowerCase();

        if (admin_customer_support_page_emailData.includes(searchInput)) {
            item.style.display = "block";
            visibleCount++;
        } else {
            item.style.display = "none";
        }
    });

    if (visibleCount === 0) {
        noUsersMsg.style.display = "block";
    } else {
        noUsersMsg.style.display = "none";
    }
}
//ID:LP-I81-End

//ID:LP-I27-start
function handleReceiptClick(receiptUrl) {
    if (!receiptUrl || !isValidUrl(receiptUrl)) {
        alert("Receipt not available");
        return;
    }

    const width = 800;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    const receiptWindow = window.open(
        receiptUrl,
        "Receipt",
        `width=${width},height=${height},top=${top},left=${left}`
    );

    if (receiptWindow) {
        receiptWindow.focus();
    }

    let isWindowClosed = false;
    const checkWindowClosed = setInterval(() => {
        if (receiptWindow.closed) {
            clearInterval(checkWindowClosed);
            isWindowClosed = true;
        }
    }, 100);

   
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}
//    custom_admin_dashboard.html (adminpanel template)
//    PaymentLottery table (models.py)
//    api_admin_dashboard_payment_lottery_list_view_transactions_and_refund_fetch_paid_amount_view function (views.py)
function handleRefundClick(paymentIntent) {
    if (!paymentIntent) {
        alert("Payment intent not available");
        return;
    }

    fetch(`/api_admin_dashboard_payment_lottery_list_view_transactions_and_refund/${paymentIntent}/fetch-paid-amount/`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.log("API Error:", data.error);
                alert(getFriendlyErrorMessage(data.error));
                return;
            }

            const paidAmount = data.paid_amount;
            const refundedAmount = data.refunded_amount; 
            const paymentStatus = data.payment_status ? data.payment_status.toLowerCase() : "";
            const lotteryDetails = data.lottery_details; 

            document.querySelector(".refund-popup")?.remove();

            if (paymentStatus === "refunded") {
                openRefundSuccessPopup(paymentIntent, refundedAmount, lotteryDetails);
                return;
            }

            const refundPopup = document.createElement("div");
            refundPopup.classList.add("refund-popup");

            const popupContent = document.createElement("div");
            popupContent.classList.add("refund-popup-content");

            refundPopup.addEventListener("click", (event) => {
                if (event.target === refundPopup) {
                    refundPopup.remove();
                }
            });

            let lotteryInfoHtml = `
                <h3>Transaction Details</h3>
                <table class="refund-table">
                    <thead>
                        <tr>
                            <th>Lottery</th>
                            <th>Quantity</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            lotteryDetails.forEach(lottery => {
                lotteryInfoHtml += `
                    <tr>
                        <td>${lottery.lottery_name}</td>
                        <td>${lottery.quantity}</td>
                        <td>£${lottery.amount.toFixed(2)}</td>
                    </tr>
                `;
            });

            lotteryInfoHtml += `</tbody></table>`;
             
           
            

            popupContent.innerHTML = `
                <h3>Refund Payment</h3>
                <p><strong>Payment Intent:</strong> ${paymentIntent}</p>
                ${lotteryInfoHtml}
                <p>Maximum refundable amount: £${paidAmount.toFixed(2)}</p>
                <input type="number" id="refundAmountInput" value="${paidAmount.toFixed(2)}" placeholder="Enter refund amount" min="0" max="${paidAmount}" step="0.01">
                <p id="refundAmountError" class="refundAmountError_error_message"></p>
                <button id="confirmRefundButton">Confirm Refund</button>
                
            `;

            const refundInput = popupContent.querySelector("#refundAmountInput");
            const refundError = popupContent.querySelector("#refundAmountError");
            const confirmRefundButton = popupContent.querySelector("#confirmRefundButton");

            refundInput.addEventListener("input", () => {
                const refundValue = parseFloat(refundInput.value);
                if (isNaN(refundValue) || refundValue <= 0) {
                    refundError.textContent = "Please enter a valid refund amount.";
                    confirmRefundButton.disabled = true;
                } else if (refundValue > paidAmount) {
                    refundError.textContent = `Refund cannot be more than £${paidAmount.toFixed(2)} GBP.`;
                    confirmRefundButton.disabled = true;
                } else {
                    refundError.textContent = "";
                    confirmRefundButton.disabled = false;
                }
            });
            //    custom_admin_dashboard.html (adminpanel template)
            //    PaymentLottery table (models.py)
            //    api_admin_dashboard_payment_lottery_list_view_transactions_and_refund_refund_payment_view function (views.py)
            confirmRefundButton.addEventListener("click", () => {
                const refundValue = parseFloat(refundInput.value);
                if (isNaN(refundValue) || refundValue <= 0 || refundValue > paidAmount) {
                    refundError.textContent = "Invalid refund amount.";
                    return;
                }

                fetch(`/api_admin_dashboard_payment_lottery_list_view_transactions_and_refund/${paymentIntent}/refund/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": custom_admin_dashboard_csrfToken,
                    },
                    body: JSON.stringify({ refund_amount: refundValue }),
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            console.log("Refund API Error:", data.error);
                            alert(getFriendlyErrorMessage(data.error));
                            return;
                        }

                        refundPopup.remove();
                        openRefundSuccessPopup(paymentIntent, refundValue, lotteryDetails);
                        updatePaymentStatus(paymentIntent);
                    })
                    .catch(error => {
                        console.log("Refund processing error:", error);
                        alert("An error occurred. Please try again.");
                    });
            });

            const cancelRefundButton = document.createElement("button");
            cancelRefundButton.textContent = "Back to my Refund List";
            cancelRefundButton.addEventListener("click", () => refundPopup.remove());

            popupContent.appendChild(cancelRefundButton);
            refundPopup.appendChild(popupContent);
            document.body.appendChild(refundPopup);
        })
        .catch(error => {
            console.log("Fetch API Error:", error);
            alert("Something went wrong. Please try again.");
        });
}
function openRefundSuccessPopup(paymentIntent, refundedAmount, lotteryDetails) {
    document.querySelector(".refund-popup")?.remove();

    const refundPopup = document.createElement("div");
    refundPopup.classList.add("refund-popup");

    const popupContent = document.createElement("div");
    popupContent.classList.add("refund-popup-content");

    refundPopup.addEventListener("click", (event) => {
        if (event.target === refundPopup) {
            refundPopup.remove();
        }
    });

     let lotteryInfoHtml = `
     <h3>Transaction Details</h3>
     <table class="refund-table">
         <thead>
             <tr>
                 <th>Lottery</th>
                 <th>Quantity</th>
                 <th>Amount</th>
             </tr>
         </thead>
         <tbody>
 `;

    lotteryDetails.forEach(lottery => {
        lotteryInfoHtml += `
            <tr>
                <td>${lottery.lottery_name}</td>
                <td>${lottery.quantity}</td>
                <td>£${lottery.amount.toFixed(2)}</td>
            </tr>
        `;
    });

    lotteryInfoHtml += `</tbody></table>`;

    popupContent.innerHTML = `
        <h3>Refund Successful - Refund Details</h3>
        <p><strong>Payment Intent:</strong> ${paymentIntent}</p>
        ${lotteryInfoHtml}
        <p><strong>Total Refunded Amount:</strong> £${refundedAmount.toFixed(2)}</p>
        <button id="closeRefundPopup">Back to my Refund List</button>
    `;

    const closeRefundButton = popupContent.querySelector("#closeRefundPopup");
    closeRefundButton.addEventListener("click", () => refundPopup.remove());

    refundPopup.appendChild(popupContent);
    document.body.appendChild(refundPopup);
}


let admin_page_transactions_list_all_data = [];
function updatePaymentStatus(paymentIntent) {
    const statusCells = document.querySelectorAll(`td[data-payment-intent="${paymentIntent}"]`);

    statusCells.forEach(statusCell => {
        statusCell.innerHTML = `<span class="custom_admin_dashboard_transactions_management_status_refunded">Refunded</span>`;
    });
    // 2. Update the matching object in admin_page_transactions_list_all_data
    admin_page_transactions_list_all_data = admin_page_transactions_list_all_data.map(entry => {
        if (entry.payment_intent === paymentIntent) {
            return { ...entry, payment_status: "refunded" };
        }
        return entry;
    });

    
}

function getFriendlyErrorMessage(errorMessage) {
    if (errorMessage.includes("already been refunded")) {
        return "This payment has already been refunded.";
    }
    if (errorMessage.includes("Payment not found")) {
        return "Payment not found.";
    }
    if (errorMessage.includes("Only completed payments can be refunded")) {
        return "Only completed payments can be refunded.";
    }
    if (errorMessage.includes("Invalid refund amount")) {
        return "Invalid refund amount.";
    }
    return "Something went wrong. Please try again."; 
}
function custom_admin_dashboard_transactions_management_function(email = null, status = null) {
    let containerId;

    if (status === "all_transactions") {
        containerId = "custom_admin_dashboard_all_transactions_management";
    } else if (status === "refunded") {
        containerId = "custom_admin_dashboard_transactions_management_refunded";
    } else {
        containerId = "custom_admin_dashboard_transactions_management";
    }

    const admin_page_transactions_container = document.getElementById(containerId);
    if (!admin_page_transactions_container) return;

    admin_page_transactions_container.innerHTML = ""; 

    const searchInputId = `transactions_management_search_input_${status || 'default'}`;
    const filterSelectId = `transactions_management_filter_select_${status || 'default'}`;

  
    let currentPage = 1;
    let totalTransactions = 0;
    let perPage = 10;
    let loadedPages = []; 



    function admin_page_transactions_createHeader() {
        const header = document.createElement("div");
        header.classList.add("custom_admin_dashboard_transactions_management_header");

        let headerText = "";
        if (email) {
            headerText = "";
        } else if (status === "refunded") {
            headerText = "Refund Management";
        } else if (status === "all_transactions") {
            headerText = "Transactions Management > Transaction Details";
        }

        header.innerHTML = `
            <div>${headerText}</div>
            <div class="transactions_management_search_container">
                <input id="${searchInputId}" class="transactions_management_search_input" 
                       placeholder="Search by Payment ID, Lottery, or Email, or Quantity" />
            </div>
            ${status !== "refunded" ? `
                <div class="transactions_management_filter_container">
                    <select id="${filterSelectId}" class="transactions_management_filter_select">
                        <option value="all">All Transactions</option>
                        <option value="completed">Completed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>` : ``}
        `;

        header.querySelector(`#${searchInputId}`).addEventListener("keyup", () => {
            admin_page_transactions_fetchData(true);
        });

        if (status !== "refunded") {
            header.querySelector(`#${filterSelectId}`).addEventListener("change", () => {
                admin_page_transactions_fetchData(true);
            });
        }
        
        return header;
    }

    const tbodyId = status === "all_transactions" 
            ? "custom_admin_dashboard_transactions_management_table_body_all_transactions"
            : status === "refunded" 
                ? "custom_admin_dashboard_transactions_management_table_body_refunded"
                : "custom_admin_dashboard_transactions_management_table_body";
    function admin_page_transactions_createTable() {
        const table = document.createElement("table");
        table.classList.add("custom_admin_dashboard_transactions_management_table");

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Payment ID</th>
                    <th>Lottery</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Email</th>
                    <th>Quantity</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody id="${tbodyId}"></tbody>
        `;

        return table;
    }
    const viewMoreId = status === "all_transactions"
            ? "custom_admin_dashboard_transactions_management_view_more_button_all_transactions"
            : status === "refunded"
                ? "custom_admin_dashboard_transactions_management_view_more_button_refunded"
                : "custom_admin_dashboard_transactions_management_view_more_button";

    const viewLessId = status === "all_transactions"
            ? "custom_admin_dashboard_transactions_management_view_less_button_all_transactions"
            : status === "refunded"
                ? "custom_admin_dashboard_transactions_management_view_less_button_refunded"
                : "custom_admin_dashboard_transactions_management_view_less_button";
    function admin_page_transactions_createPaginationButtons() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("transactions_management_pagination_wrapper");

        wrapper.innerHTML = `
            <button id="${viewMoreId}" class="custom_admin_dashboard_transactions_management_view_more_button" style="display: none;">
                View More
            </button>
            <button id="${viewLessId}" class="custom_admin_dashboard_transactions_management_view_less_button" style="display: none;">
                View Less
            </button>
           
        `;

        return wrapper;
    }
    const header = admin_page_transactions_createHeader();
    const table = admin_page_transactions_createTable();
    const pagination = admin_page_transactions_createPaginationButtons();
    
    admin_page_transactions_container.appendChild(header);
    admin_page_transactions_container.appendChild(table);
    admin_page_transactions_container.appendChild(pagination);
    const tbody = document.getElementById(tbodyId);
    
        

   function admin_page_transactions_fetchData(reset = false) {
        let apiUrl = "/api_admin_dashboard_payment_lottery_list_view_transactions_and_refund/";
        const params = new URLSearchParams();
        
        const searchInput = document.getElementById(searchInputId);
        const searchValue = searchInput ? searchInput.value.trim() : '';
        
        let filterValue = '';
        if (status !== "refunded") {
            const filterSelect = document.getElementById(filterSelectId);
            filterValue = filterSelect ? filterSelect.value : '';
        }

        if (email) params.append("email", email);
        if (status) params.append("status", status);
        if (searchValue) params.append("search", searchValue);
        if (filterValue && filterValue !== "all") {
            params.append("status", filterValue);
        }
        
        params.append("page", currentPage);
        params.append("per_page", perPage);

        apiUrl += `?${params.toString()}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (reset) {
                    admin_page_transactions_list_all_data = [];
                    loadedPages = []; 
                    perPage = 10;
                    currentPage = 1;
                    tbody.innerHTML = "";
                }
                
                admin_page_transactions_list_all_data = [...admin_page_transactions_list_all_data, ...data.transactions];
                totalTransactions = data.total_transactions;
                
                
                admin_page_transactions_displayData(data.transactions);
                admin_page_transactions_updatePaginationButtons(data.has_next);
                
                
                if (email) custom_admin_dashboard_transactions_management_displayTransactionCount();
            })
            .catch(error => console.error("Error fetching transactions:", error));
    }
    function custom_admin_dashboard_transactions_management_displayTransactionCount() {
       
        const total_number_of_transactions_count_user_details_management_element_id = document.getElementById("total_number_of_transactions_count_user_details_management");

        if (total_number_of_transactions_count_user_details_management_element_id) {
            total_number_of_transactions_count_user_details_management_element_id.textContent = `${totalTransactions}`;
        } 
    }

    function admin_page_transactions_displayData(transaction_objects) {
        if (admin_page_transactions_list_all_data.length === 0) {
            tbody.innerHTML = "";
            const noTransactionsRow = document.createElement("tr");
            noTransactionsRow.innerHTML = `
                <td colspan="8" class="custom_admin_dashboard_transactions_management_no_transactions">
                    No transactions found.
                </td>
            `;
            tbody.appendChild(noTransactionsRow);
            return;
        }

        transaction_objects.forEach(transaction => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${transaction.payment_intent}</td>
                <td>${transaction.lottery_event_title}</td>
                <td>£${transaction.amount}</td>
                <td>${new Date(transaction.payment_at).toLocaleDateString()}</td>
                <td data-payment-intent="${transaction.payment_intent}">
                    <span class="custom_admin_dashboard_transactions_management_status_${transaction.payment_status.toLowerCase()}">
                        ${transaction.payment_status}
                    </span>
                </td>
                <td>${transaction.user_email}</td>
                <td>${transaction.quantity}</td>
                <td>
                    <div class="custom_admin_dashboard_transactions_management_action_img_container">
                        <div class="custom_admin_dashboard_transactions_management_action_img" onclick="handleReceiptClick('${transaction.receipt_url}')">
                            <img class="view_Reciept" src="/media/admin_files/custom_admin_dashboard_transactions_management_receipt_icon.jpg" alt="Receipt">
                            <span class="custom_admin_dashboard_transactions_management_tooltip">View Receipt</span>
                        </div>
                        <div class="custom_admin_dashboard_transactions_management_action_img" 
                            data-refund-intent="${transaction.payment_intent}"
                            onclick="handleRefundClick('${transaction.payment_intent}')">
                            <img class="view_Refund" src="/media/admin_files/custom_admin_dashboard_transactions_management_refund_icon.jpg" alt="Refund">
                            <span class="custom_admin_dashboard_transactions_management_tooltip">Initiate Refund</span>
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

       
    }
    function loadMoreTransactions() {
        currentPage++;
        if (!loadedPages.includes(currentPage)) {
            loadedPages.push(currentPage);
        }
        admin_page_transactions_fetchData();
    }

    function loadLessTransactions() {
        if (currentPage > 1) {
            loadedPages = loadedPages.filter(page => page !== currentPage);
            currentPage--;
            
            admin_page_transactions_list_all_data = admin_page_transactions_list_all_data.slice(0, currentPage * perPage);
            tbody.innerHTML = "";
            
            admin_page_transactions_displayData(admin_page_transactions_list_all_data);
            admin_page_transactions_updatePaginationButtons(true); 
        }
    }

    function admin_page_transactions_updatePaginationButtons(hasNext) {
       
        const viewMoreBtn = document.getElementById(viewMoreId);
        const viewLessBtn = document.getElementById(viewLessId);

        viewMoreBtn.style.display = hasNext ? "block" : "none";
        
        viewLessBtn.style.display = (currentPage > 1) ? "block" : "none";
    }

   

    document.getElementById(viewMoreId)?.addEventListener("click", loadMoreTransactions);
    document.getElementById(viewLessId)?.addEventListener("click", loadLessTransactions);

    admin_page_transactions_fetchData(true);
}

//ID:LP-I27-End
// admin dash board prize management_page js code.

//ID:LP-I28-start
function renderPrizeManagementHTML() {
    let container = document.getElementById("custom_admin_dashboard_prize_management_id");
    container.innerHTML = `
        <h2 class="prize_management_heading">Prize Management</h2>

        <div class="prize_management_container">
            <div class="prize_management_card">
                <div>
                    <h4 class="prize_management_card_title">Total Winners</h4>
                    <p class="prize_management_card_value" id="prize_management_total_winners">0</p>
                </div>
                <div class="prize_management_icon_wrapper">
                    <img class="prize_management_icon" src="/media/Price_Management/Circle Icon Bagde.png" alt="Ticket Icon">
                </div>
            </div>
            
            <div class="prize_management_card">
                <div>
                    <h4 class="prize_management_card_title">Successfully Delivered</h4>
                    <p class="prize_management_card_value" id="prize_management_delivered_winners">0</p>
                </div>
                <div class="prize_management_icon_wrapper">
                    <img class="prize_management_icon" src="/media/Price_Management/Circle Icon Bagde (1).png" alt="Success Icon">
                </div>
            </div>
            
            <div class="prize_management_card">
                <div>
                    <h4 class="prize_management_card_title">Canceled</h4>
                    <p class="prize_management_card_value" id="prize_management_cancelled_winners">0</p>
                </div>
                <div class="prize_management_icon_wrapper">
                    <img class="prize_management_icon" src="/media/Price_Management/Circle Icon Bagde (2).png" alt="Cancel Icon">
                </div>
            </div>
        </div>
<div class="prize_management_table_wrapper">
        <table class="prize_management_table">
            <thead>
                <tr>
                    <th>Prize No</th>
                    <th>Ticket Number</th>
                    <th>Customer Details</th>
                    <th>Prize Details</th>
                    <th>Prize Status</th>
                    <th>Comments</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
</div>
        <div id="prize_management_no_winners" class="prize_management_hidden">No winners.</div>

        <div id="prize_management_pagination" class="prize_management_pagination">
            <ul></ul>
        </div>

        <div id="prize_management_image_popup" class="prize_management_popup prize_management_hidden">
            <span class="prize_management_popup_close">&times;</span>
            <img class="prize_management_popup_image">
        </div>
    `;
}
function paginateData(data, currentPage, itemsPerPage) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
}

function createPrizeManagementPagination(totalPages, currentPage) {
    const paginationElement = document.querySelector("#prize_management_pagination ul");
    
    if (totalPages <= 1) {
        paginationElement.innerHTML = '';
        return;
    }

    let liTag = '';
    let beforePage = Math.max(currentPage - 1, 1);
    let afterPage = Math.min(currentPage + 1, totalPages);

    if (currentPage > 1) {
        liTag += `<li class="prize_management_btn prize_management_prev" onclick="fetchWinners(${currentPage - 1})">
                    <span><i class="fas fa-angle-left"></i> Prev</span>
                  </li>`;
    }

    if (currentPage > 2) {
        liTag += `<li class="prize_management_numb" onclick="fetchWinners(1)">
                    <span>1</span>
                  </li>`;
        if (currentPage > 3) {
            liTag += `<li class="prize_management_dots"><span>...</span></li>`;
        }
    }

    for (let plength = beforePage; plength <= afterPage; plength++) {
        if (plength < 1 || plength > totalPages) continue;
        
        const active = currentPage === plength ? "prize_management_active" : "";
        liTag += `<li class="prize_management_numb ${active}" onclick="fetchWinners(${plength})">
                    <span>${plength}</span>
                  </li>`;
    }

    if (currentPage < totalPages - 1) {
        if (currentPage < totalPages - 2) {
            liTag += `<li class="prize_management_dots"><span>...</span></li>`;
        }
        liTag += `<li class="prize_management_numb" onclick="fetchWinners(${totalPages})">
                    <span>${totalPages}</span>
                  </li>`;
    }

    if (currentPage < totalPages) {
        liTag += `<li class="prize_management_btn prize_management_next" onclick="fetchWinners(${currentPage + 1})">
                    <span>Next <i class="fas fa-angle-right"></i></span>
                  </li>`;
    }

    paginationElement.innerHTML = liTag;
}
//    custom_admin_dashboard.html (adminpanel template)
//    Winner table (models.py)
//    api_admin_dashboard_prize_management_winner_list_api_view function (views.py)
let allWinnersData = []; // Store all winners data globally
function fetchWinners(page = 1) {
    fetch("/api_admin_dashboard_prize_management_winner_list_api_view/")
        .then(response => response.json())
        .then(data => {
            allWinnersData = data; // Store the full dataset
            prize_management_page_delivered_and_canceled_updateglobalcounts	(); // Update counts based on all data
            const itemsPerPage = 10;
            const totalPages = Math.ceil(data.length / itemsPerPage);
            const paginationElement = document.getElementById("prize_management_pagination");
            
            if (data.length <= itemsPerPage) {
                paginationElement.classList.add("prize_management_hidden");
            } else {
                paginationElement.classList.remove("prize_management_hidden");
            }

            const paginatedData = paginateData(data, page, itemsPerPage);
            
           
            let tableBody = document.querySelector(".prize_management_table tbody");
            tableBody.innerHTML = ""; 

            if (data.length === 0) {
                document.getElementById("prize_management_no_winners").classList.remove("prize_management_hidden");
                paginationElement.classList.add("prize_management_hidden");
                return;
            } else {
                document.getElementById("prize_management_no_winners").classList.add("prize_management_hidden");
            }

            paginatedData.forEach(winner => {
              
                

                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${winner.prize_no}</td>
                    <td>${winner.ticket_number}</td>
                    <td>${winner.customer_details.user_name} <br> ${winner.customer_details.user_email}</td>
                    <td>
                        ${winner.prize_details.lottery_title} <br>
                        <img src="${winner.prize_details.lottery_image}" class="prize_management_clickable_image">
                    </td>
                    <td>
                        <select class="prize_management_status" data-id="${winner.id}">
                            <option value="initiated" ${winner.prize_status === "initiated" ? "selected" : ""}>Initiated</option>
                            <option value="on_the_way" ${winner.prize_status === "on_the_way" ? "selected" : ""}>On the Way</option>
                            <option value="delivered" ${winner.prize_status === "delivered" ? "selected" : ""}>Delivered</option>
                            <option value="cancelled" ${winner.prize_status === "cancelled" ? "selected" : ""}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <textarea class="prize_management_comments" data-id="${winner.id}" rows="2">${winner.prize_comments || ''}</textarea>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            

            document.getElementById("prize_management_total_winners").innerText = data.length;
          

            if (data.length > itemsPerPage) {
                createPrizeManagementPagination(totalPages, page);
            }

            document.querySelectorAll(".prize_management_status").forEach(select => {
                select.addEventListener("change", updateWinnerStatus);
            });

            document.querySelectorAll(".prize_management_comments").forEach(textarea => {
                textarea.addEventListener("focusout", updateWinnerStatus);
            });

            document.querySelectorAll(".prize_management_clickable_image").forEach(image => {
                image.addEventListener("click", prize_management_openImagePopup);
            });

            document.querySelector(".prize_management_popup_close").addEventListener("click", prize_management_closeImagePopup);
        });
}

function prize_management_openImagePopup(event) {
    let popup = document.getElementById("prize_management_image_popup");
    let popupImage = popup.querySelector(".prize_management_popup_image");
    popupImage.src = event.target.src;
    popup.classList.remove("prize_management_hidden");
}

function prize_management_closeImagePopup() {
    document.getElementById("prize_management_image_popup").classList.add("prize_management_hidden");
}

function prize_management_page_delivered_and_canceled_updateglobalcounts	() {
    const deliveredWinners = allWinnersData.filter(w => w.prize_status === "delivered").length;
    const cancelledWinners = allWinnersData.filter(w => w.prize_status === "cancelled").length;
    
    document.getElementById("prize_management_delivered_winners").innerText = deliveredWinners;
    document.getElementById("prize_management_cancelled_winners").innerText = cancelledWinners;
}
//    custom_admin_dashboard.html (adminpanel template)
//    Winner table (models.py)
//    api_admin_dashboard_prize_management_update_winner_status function (views.py)
function updateWinnerStatus(event) {
    const winnerId = parseInt(event.target.dataset.id);
    const winnerRow = event.target.closest("tr");
    const prizeStatus = winnerRow.querySelector(".prize_management_status").value;
    const prizeComments = winnerRow.querySelector(".prize_management_comments").value;
    // Send the update to the server
    fetch(`/api_admin_dashboard_prize_management/${winnerId}/update_winner_status/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": admin_chats_csrfToken 
        },
        body: JSON.stringify({
            prize_status: prizeStatus,
            prize_comments: prizeComments,
        }),
    })
    .then(response => {
       if (response.ok) {
            const winnerIndex = allWinnersData.findIndex(w => w.id === winnerId);
            if (winnerIndex !== -1) {
            allWinnersData[winnerIndex].prize_status = prizeStatus;
            prize_management_page_delivered_and_canceled_updateglobalcounts	(); // Update the global counts immediately
        }
        } else {
            alert("Failed to update status.");
        }
    });
}
//ID:LP-I28-End

// custom_admin_dashboard_winners_wall_winners page winners list js code.
//ID:LP-I149-start
function winners_wall_Winners_section_setupPagination(totalItems, itemsPerPage = 6, currentPage = 1, containerSelector = '#winners_wall_winners_list_items') {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        document.querySelector('.winners_wall_Winners_section_pagination')?.remove();
        return;
    }
    
    let paginationContainer = document.querySelector('.winners_wall_Winners_section_pagination');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'winners_wall_Winners_section_pagination';
        document.querySelector(containerSelector).parentNode.insertAdjacentElement('afterend', paginationContainer);
    }
    
    paginationContainer.innerHTML = `<ul></ul>`;
    const element = paginationContainer.querySelector('ul');
    element.innerHTML = winners_wall_Winners_section_createPagination(totalPages, currentPage);
}

function winners_wall_Winners_section_createPagination(totalPages, currentPage) {
    let liTag = '';
    const maxVisiblePages = 5; 
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
        const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;
        
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxVisiblePages;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxVisiblePages + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }

    if (currentPage > 1) {
        liTag += `<li class="winners_wall_Winners_section_btn winners_wall_Winners_section_prev" onclick="winners_wall_Winners_section_handlePaginationClick(${currentPage - 1})">
            <span><i class="fas fa-angle-left"></i> Prev</span></li>`;
    }

    if (startPage > 1) {
        liTag += `<li class="winners_wall_Winners_section_numb winners_wall_Winners_section_first" onclick="winners_wall_Winners_section_handlePaginationClick(1)">
            <span>1</span></li>`;
        if (startPage > 2) {
            liTag += `<li class="winners_wall_Winners_section_dots"><span>...</span></li>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const active = currentPage === i ? "winners_wall_Winners_section_active" : "";
        liTag += `<li class="winners_wall_Winners_section_numb ${active}" onclick="winners_wall_Winners_section_handlePaginationClick(${i})">
            <span>${i}</span></li>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            liTag += `<li class="winners_wall_Winners_section_dots"><span>...</span></li>`;
        }
        liTag += `<li class="winners_wall_Winners_section_numb winners_wall_Winners_section_last" onclick="winners_wall_Winners_section_handlePaginationClick(${totalPages})">
            <span>${totalPages}</span></li>`;
    }

    if (currentPage < totalPages) {
        liTag += `<li class="winners_wall_Winners_section_btn winners_wall_Winners_section_next" onclick="winners_wall_Winners_section_handlePaginationClick(${currentPage + 1})">
            <span>Next <i class="fas fa-angle-right"></i></span></li>`;
    }

    return liTag;
}

function winners_wall_Winners_section_handlePaginationClick(page) {
    const searchTerm = document.getElementById('winners_wall_winners_list_search').value;
    custom_admin_dashboard_winners_wall_fetchWinners(searchTerm, page);
}
//    custom_admin_dashboard.html (adminpanel template)
//    WinnersWallWinnersList table (models.py)
//    custom_admin_dashboard_winner_wall_winners_list function (views.py)
function custom_admin_dashboard_winners_wall_fetchWinners(searchTerm = '', page = 1, itemsPerPage = 6) {
    const winnersContainer = document.getElementById('winners_wall_winners_list_items');
    winnersContainer.innerHTML = '<div class="winners_wall_winners_list_loading">Loading...</div>';
    
    fetch(`/api/custom_admin_dashboard_winner_wall_winners_list/?search=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(data => {
            winnersContainer.innerHTML = '';
            
            if (data.length === 0) {
                winnersContainer.innerHTML = '<div class="winners_wall_winners_list_no_results">No Winners found.</div>';
                winners_wall_Winners_section_setupPagination(0);
                return;
            }
            
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedData = data.slice(startIndex, endIndex);
            
            paginatedData.forEach(winner => {
                const winnerCard = document.createElement('div');
                winnerCard.className = `winners_wall_winners_list_card ${winner.flag ? '' : 'winners_wall_winners_list_hidden'}`;
                winnerCard.innerHTML = `
                    <div class="winners_wall_winners_list_image_container">
                        ${winner.image_url ? `<img src="${winner.image_url}" alt="${winner.winner_name}" class="winners_wall_winners_list_image">` : '<div class="winners_wall_winners_list_no_image">No Image</div>'}
                        <button class="winners_wall_winners_list_edit_btn" data-id="${winner.id}">
                            <img src="/media/admin_files/edit-img.png" alt="Edit">
                        </button>
                        <button class="winners_wall_winners_list_toggle_btn" data-id="${winner.id}" data-flag="${winner.flag ? '1' : '0'}">
                            ${winner.flag ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <div class="winners_wall_winners_list_details">
                        <table>
                            <tr>
                                <th>Lottery Name</th>
                                <td>${winner.lottery_name}</td>
                            </tr>
                            <tr>
                                <th>Winner Name</th>
                                <td>${winner.winner_name}</td>
                            </tr>
                            <tr>
                                <th>Ticket Number</th>
                                <td>${winner.ticket_number}</td>
                            </tr>
                            <tr>
                                <th>Draw Date</th>
                                <td>${winner.draw_date_formatted || 'Invalid Date'}</td>
                            </tr>
                        </table>
                    </div>
                `;
                
                winnersContainer.appendChild(winnerCard);
            });
            
            winners_wall_Winners_section_setupPagination(data.length, itemsPerPage, page);
            document.querySelectorAll('.winners_wall_winners_list_edit_btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    custom_admin_dashboard_winners_wall_add_winners_function(this.dataset.id);
                });
            });
            
            document.querySelectorAll('.winners_wall_winners_list_toggle_btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const winnerId = this.dataset.id;
                    const newFlag = this.dataset.flag === '1' ? '0' : '1';
                    
                    fetch(`/api/custom_admin_dashboard_winner_wall_winner_detail/${winnerId}/`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': custom_admin_dashboard_csrfToken,
                        },
                        body: JSON.stringify({ flag: newFlag })
                    })
                    .then(response => response.json())
                    .then(data => {
                        this.dataset.flag = newFlag;
                        this.textContent = newFlag === '1' ? 'Hide' : 'Show';
                        const card = this.closest('.winners_wall_winners_list_card');
                        if (newFlag === '1') {
                            card.classList.remove('winners_wall_winners_list_hidden');
                        } else {
                            card.classList.add('winners_wall_winners_list_hidden');
                        }
                    });
                });
            });
        })
        .catch(error => {
            winnersContainer.innerHTML = '<div class="winners_wall_winners_list_error">Error loading winners.</div>';
            console.error('Error:', error);
        });
}
function custom_admin_dashboard_winners_wall_function() {
    const container = document.getElementById('custom_admin_dashboard_winners_wall_management_winners_and_testimonials');
    container.innerHTML = '';
    
    const winnersWallDiv = document.createElement('div');
    winnersWallDiv.className = 'winners_wall_winners_list_container';
    
    const winners_wall_navHeader = document.createElement('div');
    winners_wall_navHeader.className = 'winners_wall_winners_list_nav_header';
    winners_wall_navHeader.innerHTML = `
        <h2>Winners Wall &gt; Winners</h2>
        <div class="winners_wall_winners_list_controls">
        <h4>Select the Page</h4>
            <select id="winners_wall_winners_list_page_select" class="winners_wall_winners_list_select">
                <option value="winners">Winners</option>
                <option value="testimonial">Testimonial</option>
            </select>
            <button id="winners_wall_winners_list_add_btn" class="winners_wall_winners_list_button">Add Winners</button>
            <input type="text" id="winners_wall_winners_list_search" class="winners_wall_winners_list_search" placeholder="Search winners...">
        </div>
    `;
    
    winnersWallDiv.appendChild(winners_wall_navHeader);

    const pageSelect = winners_wall_navHeader.querySelector('#winners_wall_winners_list_page_select');
    const addButton = winners_wall_navHeader.querySelector('#winners_wall_winners_list_add_btn');

    if (pageSelect) {
        pageSelect.addEventListener('change', function() {
            if (this.value === 'testimonial') {
                custom_admin_dashboard_winners_wall_testimonial_function();
            }
        });
    }

    if (addButton) {
        addButton.addEventListener('click', function() {
            custom_admin_dashboard_winners_wall_add_winners_function();
        });
    }
    
    const currentWinnersSection = document.createElement('div');
    currentWinnersSection.className = 'winners_wall_winners_list_current_winners';
    currentWinnersSection.innerHTML = '<h3>Current Winners</h3>';
    
    const winnersContainer = document.createElement('div');
    winnersContainer.id = 'winners_wall_winners_list_items';
    winnersContainer.className = 'winners_wall_winners_list_items_container';
    currentWinnersSection.appendChild(winnersContainer);
    winnersWallDiv.appendChild(currentWinnersSection);
    
    container.appendChild(winnersWallDiv);
    
    const searchInput = document.getElementById('winners_wall_winners_list_search');
    searchInput.addEventListener('input', function(e) {
        custom_admin_dashboard_winners_wall_fetchWinners(e.target.value);
    });
    
    custom_admin_dashboard_winners_wall_fetchWinners();
}

//    custom_admin_dashboard.html (adminpanel template)
//    WinnersWallWinnersList table (models.py)
//    custom_admin_dashboard_winner_wall_winners_list function (views.py)
function winners_wall_Winners_edit_add_show_popup(mode = 'add', winnerData = null) {
    const overlay = document.createElement('div');
    overlay.className = 'winners_wall_Winners_edit_add_overlay';
    overlay.id = 'winners_wall_Winners_edit_add_overlay';
    
    const popup = document.createElement('div');
    popup.className = 'winners_wall_Winners_edit_add_container';
    
    const title = mode === 'add' ? 'Add Winner' : 'Edit Winner';
    
    const header = document.createElement('div');
    header.className = 'winners_wall_Winners_edit_add_header';
    header.innerHTML = `
        <div class="winners_wall_Winners_edit_add_title">
            <span id="winners_wall_Winners_edit_add_title_winners_wall">Winners Wall</span> > 
            <span id="winners_wall_Winners_edit_add_title_winners">Winners</span> > 
            ${title}
        </div>
        <button class="winners_wall_Winners_edit_add_close">&times;</button>
    `;
    
    const content = document.createElement('div');
    content.className = 'winners_wall_Winners_edit_add_content';
    
    const imageSection = document.createElement('div');
    imageSection.className = 'winners_wall_Winners_edit_add_image_section';
    imageSection.innerHTML = `
        <div class="winners_wall_Winners_edit_add_upload_container">
            <label for="winners_wall_Winners_edit_add_image_upload" class="winners_wall_Winners_edit_add_upload_btn">
                    <img src="/media/admin_files/upload-img.png" alt="Upload Icon" />    
            Choose File
            </label>
          
            <input type="file" id="winners_wall_Winners_edit_add_image_upload" class="winners_wall_Winners_edit_add_file_input" accept="image/*">
            
            <div class="winners_wall_Winners_edit_add_error" id="winners_wall_Winners_edit_add_image_error">Please select an image</div>
        </div>
        <div class="winners_wall_Winners_edit_add_image_preview" id="winners_wall_Winners_edit_add_image_preview">
            ${winnerData && winnerData.image_url ? 
                `<img src="${winnerData.image_url}" alt="Winner Image">` : 
                'No image selected'}
        </div>
    `;
    
    const form = document.createElement('form');
    form.className = 'winners_wall_Winners_edit_add_form';
    form.innerHTML = `
        <div class="winners_wall_Winners_edit_add_form_group" id="winners_wall_Winners_edit_add_lottery_name_group">
            <label for="winners_wall_Winners_edit_add_lottery_name">Lottery Name</label>
            <input type="text" id="winners_wall_Winners_edit_add_lottery_name" value="${winnerData ? winnerData.lottery_name : ''}">
            <div class="winners_wall_Winners_edit_add_error" id="winners_wall_Winners_edit_add_lottery_name_error">Please enter a lottery name</div>
        </div>
        <div class="winners_wall_Winners_edit_add_form_group" id="winners_wall_Winners_edit_add_winner_name_group">
            <label for="winners_wall_Winners_edit_add_winner_name">Winner Name</label>
            <input type="text" id="winners_wall_Winners_edit_add_winner_name" value="${winnerData ? winnerData.winner_name : ''}">
            <div class="winners_wall_Winners_edit_add_error" id="winners_wall_Winners_edit_add_winner_name_error">Please enter a winner name</div>
        </div>
        <div class="winners_wall_Winners_edit_add_form_group" id="winners_wall_Winners_edit_add_ticket_number_group">
            <label for="winners_wall_Winners_edit_add_ticket_number">Ticket Number</label>
            <input type="number" id="winners_wall_Winners_edit_add_ticket_number" value="${winnerData ? winnerData.ticket_number : ''}">
            <div class="winners_wall_Winners_edit_add_error" id="winners_wall_Winners_edit_add_ticket_number_error">Please enter a ticket number</div>
        </div>
        <div class="winners_wall_Winners_edit_add_form_group winners_wall_Winners_edit_add_date_time_group" id="winners_wall_Winners_edit_add_draw_date_group">
            <label>Draw Date</label>
            <div class="winners_wall_Winners_edit_add_date_time">
                <input type="date" id="winners_wall_Winners_edit_add_draw_date" value="${winnerData && winnerData.draw_date ? winnerData.draw_date.split('T')[0] : ''}">
                <input type="time" id="winners_wall_Winners_edit_add_draw_time" value="${winnerData && winnerData.draw_date ? winnerData.draw_date.split('T')[1].substring(0, 5) : '11:00'}">
            </div>
            <div class="winners_wall_Winners_edit_add_error" id="winners_wall_Winners_edit_add_draw_date_error">Please select a draw date and time</div>
        </div>
    `;
    
    const buttons = document.createElement('div');
    buttons.className = 'winners_wall_Winners_edit_add_buttons';
    buttons.innerHTML = `
        <button type="button" class="winners_wall_Winners_edit_add_cancel_btn">Cancel</button>
        <button type="button" class="winners_wall_Winners_edit_add_submit_btn" id="winners_wall_Winners_edit_add_submit_btn">
            ${mode === 'add' ? 'Add Winner' : 'Update'}
        </button>
    `;
    
    content.appendChild(imageSection);
    content.appendChild(form);
    content.appendChild(buttons);
    popup.appendChild(header);
    popup.appendChild(content);
    overlay.appendChild(popup);
    
    document.body.appendChild(overlay);
    
    const closeBtn = popup.querySelector('.winners_wall_Winners_edit_add_close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    const cancelBtn = popup.querySelector('.winners_wall_Winners_edit_add_cancel_btn');
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    const winnersWallTitle = popup.querySelector('#winners_wall_Winners_edit_add_title_winners_wall');
    const winnersTitle = popup.querySelector('#winners_wall_Winners_edit_add_title_winners');
    
    winnersWallTitle.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    winnersTitle.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    const fileInput = popup.querySelector('#winners_wall_Winners_edit_add_image_upload');
    const imagePreview = popup.querySelector('#winners_wall_Winners_edit_add_image_preview');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                hideError('winners_wall_Winners_edit_add_image_error');
            };
            reader.readAsDataURL(file);
        }
    });
    
    function showError(fieldId, errorId) {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(errorId);
        const group = field.closest('.winners_wall_Winners_edit_add_form_group') || 
                      field.closest('.winners_wall_Winners_edit_add_date_time_group');
        
        if (group) group.classList.add('invalid');
        if (error) error.classList.add('show');
    }
    
    function hideError(errorId) {
        const error = document.getElementById(errorId);
        if (error) {
            error.classList.remove('show');
            const group = error.closest('.winners_wall_Winners_edit_add_form_group') || 
                           error.closest('.winners_wall_Winners_edit_add_date_time_group');
            if (group) group.classList.remove('invalid');
        }
    }
    
    function validateField(fieldId, errorId) {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            showError(fieldId, errorId);
            return false;
        } else {
            hideError(errorId);
            return true;
        }
    }
    
    function validateDateTime() {
        const dateField = document.getElementById('winners_wall_Winners_edit_add_draw_date');
        const timeField = document.getElementById('winners_wall_Winners_edit_add_draw_time');
        const errorId = 'winners_wall_Winners_edit_add_draw_date_error';
        
        if (!dateField.value || !timeField.value) {
            showError('winners_wall_Winners_edit_add_draw_date', errorId);
            return false;
        } else {
            hideError(errorId);
            return true;
        }
    }
    function validateTicketNumber() {
    const input = document.getElementById('winners_wall_Winners_edit_add_ticket_number');
    const errorDiv = document.getElementById('winners_wall_Winners_edit_add_ticket_number_error');
    const value = input.value.trim();

    if (value === '') {
        errorDiv.textContent = 'Please enter a ticket number';
        errorDiv.style.display = 'block';
        return false;
    }

    if (!/^\d+$/.test(value)) {
        errorDiv.textContent = 'Ticket number must be numeric';
        errorDiv.style.display = 'block';
        return false;
    }

    if (value.length > 6) {
        errorDiv.textContent = 'Ticket number must be 6 digits';
        errorDiv.style.display = 'block';
        return false;
    }

    errorDiv.style.display = 'none';
    return true;
}

    
    document.getElementById('winners_wall_Winners_edit_add_lottery_name').addEventListener('input', function() {
        validateField('winners_wall_Winners_edit_add_lottery_name', 'winners_wall_Winners_edit_add_lottery_name_error');
    });
    
    document.getElementById('winners_wall_Winners_edit_add_winner_name').addEventListener('input', function() {
        validateField('winners_wall_Winners_edit_add_winner_name', 'winners_wall_Winners_edit_add_winner_name_error');
    });
    
    document.getElementById('winners_wall_Winners_edit_add_ticket_number').addEventListener('input', function() {
        validateField('winners_wall_Winners_edit_add_ticket_number', 'winners_wall_Winners_edit_add_ticket_number_error');
    });
    
    document.getElementById('winners_wall_Winners_edit_add_draw_date').addEventListener('change', validateDateTime);
    document.getElementById('winners_wall_Winners_edit_add_draw_time').addEventListener('change', validateDateTime);
    
    const submitBtn = popup.querySelector('#winners_wall_Winners_edit_add_submit_btn');
    submitBtn.addEventListener('click', function() {
        const isLotteryNameValid = validateField('winners_wall_Winners_edit_add_lottery_name', 'winners_wall_Winners_edit_add_lottery_name_error');
        const isWinnerNameValid = validateField('winners_wall_Winners_edit_add_winner_name', 'winners_wall_Winners_edit_add_winner_name_error');
        const isDateTimeValid = validateDateTime();
        const isTicketNumberValid = validateTicketNumber(); 
        if (!isLotteryNameValid || !isWinnerNameValid || !isTicketNumberValid || !isDateTimeValid) {
            return;
        }
        
        const lotteryName = document.getElementById('winners_wall_Winners_edit_add_lottery_name').value;
        const winnerName = document.getElementById('winners_wall_Winners_edit_add_winner_name').value;
        const ticketNumber = document.getElementById('winners_wall_Winners_edit_add_ticket_number').value;
        const drawDate = document.getElementById('winners_wall_Winners_edit_add_draw_date').value;
        const drawTime = document.getElementById('winners_wall_Winners_edit_add_draw_time').value;
        const imageFile = fileInput.files[0];
        
        const drawDateTime = `${drawDate}T${drawTime}:00`;
        
        const formData = new FormData();
        formData.append('lottery_name', lotteryName);
        formData.append('winner_name', winnerName);
        formData.append('ticket_number', ticketNumber);
        formData.append('draw_date', drawDateTime);
        formData.append('flag', true);
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        const url = mode === 'add' ? '/api/custom_admin_dashboard_winner_wall_winners_list/' : `/api/custom_admin_dashboard_winner_wall_winner_detail/${winnerData.id}/`;
        const method = mode === 'add' ? 'POST' : 'PUT';
        
        fetch(url, {
            method: method,
            headers: {
                'X-CSRFToken': custom_admin_dashboard_csrfToken,
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.id) {
                custom_admin_dashboard_winners_wall_fetchWinners(); 
                document.body.removeChild(overlay);
            } else {
                alert('Error saving winner: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error saving winner');
        });
    });
}

//    custom_admin_dashboard.html (adminpanel template)
//    WinnersWallWinnersList table (models.py)
//    custom_admin_dashboard_winner_wall_winner_detail function (views.py)
function custom_admin_dashboard_winners_wall_add_winners_function(winnerId = null) {
    if (winnerId) {
        fetch(`/api/custom_admin_dashboard_winner_wall_winner_detail/${winnerId}/`)
            .then(response => response.json())
            .then(data => {
                winners_wall_Winners_edit_add_show_popup('edit', data);
            })
            .catch(error => {
                console.error('Error fetching winner:', error);
                alert('Error loading winner data');
            });
    } else {
        winners_wall_Winners_edit_add_show_popup('add');
    }
}


// Main controller function(custom_admin_dashboard_winners_wall_testimonial_function) for testimonials management page. 
function custom_admin_dashboard_winners_wall_testimonial_function() {
    const container = document.getElementById('custom_admin_dashboard_winners_wall_management_winners_and_testimonials');
    container.innerHTML = '';
    
    const navHeader = document.createElement('div');
    navHeader.className = 'winners_wall_testimonial_nav_header';
    navHeader.innerHTML = `
        <span class="winners_wall_testimonial_nav_title">
            <span class="winners_wall_testimonial_nav_clickable" 
                  onclick="custom_admin_dashboard_winners_wall_function()">Winners Wall</span> > Testimonial
        </span>
        <div class="winners_wall_testimonial_controls">
        <h4>Select the Page</h4>
            <select id="winners_wall_testimonial_section_select" class="winners_wall_testimonial_select">
                <option value="testimonial" selected>Testimonial</option>
                <option value="winners">Winners</option>
            </select>
           
            <button id="winners_wall_testimonial_add_btn" class="winners_wall_testimonial_add_btn">
                Add Testimonial
            </button>
             <input type="text" id="winners_wall_testimonial_search" class="winners_wall_testimonial_search" 
                   placeholder="Search testimonials...">
        </div>
    `;
    container.appendChild(navHeader);
    
    document.getElementById('winners_wall_testimonial_section_select').addEventListener('change', function() {
        if (this.value === 'winners') custom_admin_dashboard_winners_wall_function();
    });
    
    document.getElementById('winners_wall_testimonial_add_btn').addEventListener('click', function() {
        custom_admin_dashboard_winners_wall_add_testimonial_function();
    });
    
    let searchTimeout;
    document.getElementById('winners_wall_testimonial_search').addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            winners_wall_testimonial_load_testimonials(this.value.trim());
        }, 300);
    });
    
    winners_wall_testimonial_load_testimonials();
}





var winners_wall_testimonial_current_page = winners_wall_testimonial_current_page || 1;
var winners_wall_testimonial_items_per_page = 10;
var winners_wall_testimonial_total_items = winners_wall_testimonial_total_items || 0;
var winners_wall_testimonial_all_data = winners_wall_testimonial_all_data || [];

//    custom_admin_dashboard.html (adminpanel template)
//    Testimonial table (models.py)
//    custom_admin_dashboard_winners_wall_testimonials_list function (views.py)
function winners_wall_testimonial_load_testimonials(searchQuery = '') {
    const container = document.getElementById('custom_admin_dashboard_winners_wall_management_winners_and_testimonials');
    
    const existingContent = container.querySelector('.winners_wall_testimonial_content_container');
    if (existingContent) container.removeChild(existingContent);
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'winners_wall_testimonial_loading';
    loadingDiv.textContent = 'Loading testimonials...';
    container.appendChild(loadingDiv);
    
    let url = '/api/custom_admin_dashboard_winners_wall_testimonials_list/';
    if (searchQuery) {
        url += `?search=${encodeURIComponent(searchQuery)}`;
    }
    
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            container.removeChild(loadingDiv);
            
            winners_wall_testimonial_all_data = data;
            winners_wall_testimonial_total_items = data.length;
            
            if (searchQuery) {
                winners_wall_testimonial_current_page = 1;
            }
            
            const contentContainer = document.createElement('div');
            contentContainer.className = 'winners_wall_testimonial_content_container';
            container.appendChild(contentContainer);
            
            winners_wall_testimonial_display_page(contentContainer, searchQuery);
            
            if (winners_wall_testimonial_total_items > winners_wall_testimonial_items_per_page) {
                winners_wall_testimonial_create_pagination(contentContainer);
            }
        })
        .catch(error => {
            console.error('Error loading testimonials:', error);
            container.removeChild(loadingDiv);
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'winners_wall_testimonial_error';
            errorDiv.textContent = 'Error loading testimonials. Please try again.';
            container.appendChild(errorDiv);
        });
}

function winners_wall_testimonial_display_page(container, searchQuery = '') {
    const existingSection = container.querySelector('.winners_wall_testimonial_table_section');
    if (existingSection) container.removeChild(existingSection);
    
    const section = document.createElement('div');
    section.className = 'winners_wall_testimonial_table_section';
    
    const heading = document.createElement('h3');
    heading.className = 'winners_wall_testimonial_heading';
    heading.textContent = 'Current Testimonial';
    section.appendChild(heading);
    
    const startIndex = (winners_wall_testimonial_current_page - 1) * winners_wall_testimonial_items_per_page;
    const endIndex = Math.min(startIndex + winners_wall_testimonial_items_per_page, winners_wall_testimonial_total_items);
    const pageData = winners_wall_testimonial_all_data.slice(startIndex, endIndex);
    
    if (winners_wall_testimonial_total_items === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'winners_wall_testimonial_empty';
        emptyDiv.textContent = searchQuery ? 
            'No testimonials found matching your search.' : 
            'No testimonials found.';
        section.appendChild(emptyDiv);
        container.appendChild(section);
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'winners_wall_testimonial_table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>IMAGE</th>
            <th>CONTENT</th>
            <th>NAME</th>
        </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    pageData.forEach(testimonial => {
        const row = document.createElement('tr');
        row.className = 'winners_wall_testimonial_row';
        row.innerHTML = `
            <td class="winners_wall_testimonial_image_cell">
                <img src="${testimonial.image}" alt="${testimonial.name}" 
                     class="winners_wall_testimonial_image"
                     onclick="winners_wall_testimonial_show_image('${testimonial.image}')">
            </td>
            <td class="winners_wall_testimonial_content_cell">
                ${testimonial.quote}
            </td>
            <td class="winners_wall_testimonial_name_cell">
                <div class="winners_wall_testimonial_actions">
                    <button class="winners_wall_testimonial_edit_btn" 
                            onclick="custom_admin_dashboard_winners_wall_add_testimonial_function(${testimonial.id})">
                        Edit
                    </button>
                    <button class="winners_wall_testimonial_delete_btn" 
                            onclick="winners_wall_testimonial_delete(${testimonial.id})">
                        Delete
                    </button>
                </div>
                <div class="winners_wall_testimonial_name">${testimonial.name}</div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    section.appendChild(table);
    container.appendChild(section);
}


function winners_wall_testimonial_create_pagination(container) {
    const totalPages = Math.ceil(winners_wall_testimonial_total_items / winners_wall_testimonial_items_per_page);
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'winners_wall_testimonial_pagination';
    
    const paginationUL = document.createElement('ul');
    paginationContainer.appendChild(paginationUL);
    
    let liTag = '';
    const currentPage = winners_wall_testimonial_current_page;
    
    if (currentPage > 1) {
        liTag += `<li class="winners_wall_testimonial_btn winners_wall_testimonial_prev" 
                     onclick="winners_wall_testimonial_change_page(${currentPage - 1})">
                     <span><i class="fas fa-angle-left"></i> Prev</span></li>`;
    }
    
    if (totalPages > 1) {
        const active = currentPage === 1 ? 'winners_wall_testimonial_active' : '';
        liTag += `<li class="winners_wall_testimonial_numb ${active}" 
                      onclick="winners_wall_testimonial_change_page(1)">
                      <span>1</span></li>`;
    }
    
    if (currentPage > 3 && totalPages > 3) {
        liTag += `<li class="winners_wall_testimonial_dots"><span>...</span></li>`;
    }
    
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = startPage; i <= endPage; i++) {
        if (i < 2 || i > totalPages - 1) continue;
        
        const active = currentPage === i ? 'winners_wall_testimonial_active' : '';
        liTag += `<li class="winners_wall_testimonial_numb ${active}" 
                      onclick="winners_wall_testimonial_change_page(${i})">
                      <span>${i}</span></li>`;
    }
    
    if (currentPage < totalPages - 2 && totalPages > 3) {
        liTag += `<li class="winners_wall_testimonial_dots"><span>...</span></li>`;
    }
    
    if (totalPages > 1) {
        const active = currentPage === totalPages ? 'winners_wall_testimonial_active' : '';
        liTag += `<li class="winners_wall_testimonial_numb ${active}" 
                      onclick="winners_wall_testimonial_change_page(${totalPages})">
                      <span>${totalPages}</span></li>`;
    }
    
    if (currentPage < totalPages) {
        liTag += `<li class="winners_wall_testimonial_btn winners_wall_testimonial_next" 
                     onclick="winners_wall_testimonial_change_page(${currentPage + 1})">
                     <span>Next <i class="fas fa-angle-right"></i></span></li>`;
    }
    
    paginationUL.innerHTML = liTag;
    container.appendChild(paginationContainer);
}

function winners_wall_testimonial_change_page(newPage) {
    const container = document.querySelector('.winners_wall_testimonial_content_container');
    const totalPages = Math.ceil(winners_wall_testimonial_total_items / winners_wall_testimonial_items_per_page);
    
    if (newPage > totalPages) {
        newPage = Math.max(1, totalPages);
    }
    
    winners_wall_testimonial_current_page = newPage;
    
    const startIndex = (newPage - 1) * winners_wall_testimonial_items_per_page;
    if (startIndex >= winners_wall_testimonial_total_items && winners_wall_testimonial_total_items > 0) {
        winners_wall_testimonial_current_page = Math.max(1, newPage - 1);
        winners_wall_testimonial_display_page(container);
    } else {
        winners_wall_testimonial_display_page(container);
    }
    
    const paginationContainer = document.querySelector('.winners_wall_testimonial_pagination');
    if (paginationContainer) {
        container.removeChild(paginationContainer);
        if (winners_wall_testimonial_total_items > winners_wall_testimonial_items_per_page) {
            winners_wall_testimonial_create_pagination(container);
        }
    }
}


function winners_wall_testimonial_show_image(imageUrl) {
    const lightbox = document.createElement('div');
    lightbox.className = 'winners_wall_testimonial_lightbox';
    lightbox.innerHTML = `
        <div class="winners_wall_testimonial_lightbox_content">
            <span class="winners_wall_testimonial_lightbox_close" 
                  onclick="document.body.removeChild(this.parentNode.parentNode)">&times;</span>
            <img src="${imageUrl}" class="winners_wall_testimonial_lightbox_image">
        </div>
    `;
    document.body.appendChild(lightbox);
}


function winners_wall_testimonial_delete(testimonialId) {
    if (!confirm('Are you sure you want to delete this testimonial?')) {
        return;
    }
    
    fetch(`/api/custom_admin_dashboard_winners_wall_testimonial_detail/${testimonialId}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': custom_admin_dashboard_csrfToken,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            winners_wall_testimonial_all_data = winners_wall_testimonial_all_data.filter(
                item => item.id !== testimonialId
            );
            winners_wall_testimonial_total_items = winners_wall_testimonial_all_data.length;
            
            const itemsPerPage = winners_wall_testimonial_items_per_page;
            const currentPage = winners_wall_testimonial_current_page;
            const startIndex = (currentPage - 1) * itemsPerPage;
            
            if (startIndex >= winners_wall_testimonial_total_items && currentPage > 1) {
                winners_wall_testimonial_current_page = currentPage - 1;
            }
            
            const container = document.querySelector('.winners_wall_testimonial_content_container');
            if (container) {
                winners_wall_testimonial_display_page(container);
                
                const paginationContainer = document.querySelector('.winners_wall_testimonial_pagination');
                if (paginationContainer) {
                    container.removeChild(paginationContainer);
                    if (winners_wall_testimonial_total_items > itemsPerPage) {
                        winners_wall_testimonial_create_pagination(container);
                    }
                }
            }
        } else {
            alert('Error deleting testimonial');
        }
    })
    .catch(error => {
        console.error('Error deleting testimonial:', error);
        alert('Error deleting testimonial');
    });
}


function custom_admin_dashboard_winners_wall_add_testimonial_function(testimonialId = null) {
    const container = document.getElementById('custom_admin_dashboard_winners_wall_management_winners_and_testimonials');
    container.innerHTML = '';
    
    const isEditMode = testimonialId !== null;
    
    const popupContainer = document.createElement('div');
    popupContainer.className = 'winners_wall_testimonial_popup_container';
    
    const navHeader = document.createElement('div');
    navHeader.className = 'winners_wall_testimonial_nav_header';
    navHeader.innerHTML = `
        <span class="winners_wall_testimonial_nav_title">
            <span class="winners_wall_testimonial_nav_clickable" 
                  onclick="custom_admin_dashboard_winners_wall_function()">Winners Wall</span> > 
            <span class="winners_wall_testimonial_nav_clickable" 
                  onclick="custom_admin_dashboard_winners_wall_testimonial_function()">Testimonial</span> > 
            <span>${isEditMode ? 'Edit Testimonial' : 'Add Testimonial'}</span>
        </span>
    `;
    popupContainer.appendChild(navHeader);
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'winners_wall_testimonial_popup_content';
    
    const form = document.createElement('form');
    form.id = 'winners_wall_testimonial_form';
    form.className = 'winners_wall_testimonial_form';
    
    const imageSection = document.createElement('div');
    imageSection.className = 'winners_wall_testimonial_image_section';
    imageSection.innerHTML = `
       <div class="winners_wall_testimonial_image_upload">
    <label class="winners_wall_testimonial_upload_label">Upload Image</label>
    <input type="file" id="winners_wall_testimonial_image_input" class="winners_wall_testimonial_image_input" accept="image/*">
    <label for="winners_wall_testimonial_image_input" src="/media/admin_files/upload-img.png" class="winners_wall_testimonial_choose_file_btn">
        <img src="/media/admin_files/upload-img.png" alt="Upload Icon" />
        Choose File
    </label>
</div>

        <div class="winners_wall_testimonial_image_preview_container">
            <img id="winners_wall_testimonial_image_preview" class="winners_wall_testimonial_image_preview" 
                 src="${isEditMode ? '/media/admin_files/No_image_available.png' : '/media/admin_files/no_image.png'}" 
                 alt="Preview">
        </div>
    `;
    form.appendChild(imageSection);
    
    
    const fieldsSection = document.createElement('div');
    fieldsSection.className = 'winners_wall_testimonial_fields_section';
    fieldsSection.innerHTML = `
    <div class="winners_wall_testimonial_field">
        <label for="winners_wall_testimonial_name_input" class="winners_wall_testimonial_field_label">Winner Name</label>
        <input type="text" id="winners_wall_testimonial_name_input" class="winners_wall_testimonial_text_input" 
               placeholder="Enter winner name">
        <div class="winners_wall_testimonial_error_message" id="winners_wall_testimonial_winner_name_error" style="color:red; font-size: 12px; display:none;"></div>
    </div>
    <div class="winners_wall_testimonial_field">
        <label for="winners_wall_testimonial_quote_input" class="winners_wall_testimonial_field_label">Winner Quote/Content</label>
        <textarea id="winners_wall_testimonial_quote_input" class="winners_wall_testimonial_textarea_input" 
                  placeholder="Enter testimonial content"></textarea>
        <div class="winners_wall_testimonial_error_message" id="winners_wall_testimonial_winner_quote_error" style="color:red; font-size: 12px; display:none;"></div>
    </div>
`;

    form.appendChild(fieldsSection);
    
    const buttonsSection = document.createElement('div');
    buttonsSection.className = 'winners_wall_testimonial_buttons_section';
    buttonsSection.innerHTML = `
        <button type="button" class="winners_wall_testimonial_cancel_btn" 
                onclick="custom_admin_dashboard_winners_wall_testimonial_function()">Cancel</button>
        <button type="button" class="winners_wall_testimonial_submit_btn" 
                id="winners_wall_testimonial_submit_btn">${isEditMode ? 'Update' : 'Add Testimonial'}</button>
    `;
    form.appendChild(buttonsSection);
    
    contentContainer.appendChild(form);
    popupContainer.appendChild(contentContainer);
    container.appendChild(popupContainer);
    
    document.getElementById('winners_wall_testimonial_image_input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('winners_wall_testimonial_image_preview').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    if (isEditMode) {
        winners_wall_testimonial_load_testimonial_data(testimonialId);
    }
    
    document.getElementById('winners_wall_testimonial_submit_btn').addEventListener('click', function() {
        winners_wall_testimonial_handle_submit(isEditMode, testimonialId);
    });
}

function winners_wall_testimonial_load_testimonial_data(testimonialId) {
    fetch(`/api/custom_admin_dashboard_winners_wall_testimonial_detail/${testimonialId}/`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            document.getElementById('winners_wall_testimonial_name_input').value = data.name || '';
            document.getElementById('winners_wall_testimonial_quote_input').value = data.quote || '';
            
            if (data.image) {
                document.getElementById('winners_wall_testimonial_image_preview').src = data.image;
            }
        })
        .catch(error => {
            console.error('Error loading testimonial data:', error);
            alert('Error loading testimonial data. Please try again.');
        });
}
//    custom_admin_dashboard.html (adminpanel template)
//    Testimonial table (models.py)
//    custom_admin_dashboard_winners_wall_testimonial_detail function (views.py)
function winners_wall_testimonial_handle_submit(isEditMode, testimonialId = null) {
    const nameInput = document.getElementById('winners_wall_testimonial_name_input');
    const quoteInput = document.getElementById('winners_wall_testimonial_quote_input');
    const imageInput = document.getElementById('winners_wall_testimonial_image_input');

    const name = nameInput.value.trim();
    const quote = quoteInput.value.trim();

    const nameError = document.getElementById('winners_wall_testimonial_winner_name_error');
    const quoteError = document.getElementById('winners_wall_testimonial_winner_quote_error');

    // Clear previous error messages
    nameError.style.display = 'none';
    quoteError.style.display = 'none';

    let hasError = false;

    if (!name) {
        nameError.innerText = 'Winner name is required';
        nameError.style.display = 'block';
        hasError = true;
    }

    if (!quote) {
        quoteError.innerText = 'Testimonial content is required';
        quoteError.style.display = 'block';
        hasError = true;
    }

    if (hasError) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('quote', quote);
    
    if (imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }
    
    const url = isEditMode ? `/api/custom_admin_dashboard_winners_wall_testimonial_detail/${testimonialId}/` : '/api/custom_admin_dashboard_winners_wall_testimonials_list/';
    const method = isEditMode ? 'PUT' : 'POST';
    
    const submitBtn = document.getElementById('winners_wall_testimonial_submit_btn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;
    
    fetch(url, {
        method: method,
        headers: {
            'X-CSRFToken': custom_admin_dashboard_csrfToken
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        custom_admin_dashboard_winners_wall_testimonial_function();
    })
    .catch(error => {
        console.error('Error saving testimonial:', error);
        alert('Error saving testimonial. Please try again.');
    })
    .finally(() => {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    });
}
//ID:LP-I149-End


function showSpecificDiv(id) {
    const section = document.querySelector(".custom_admin_dashboard_dashboard");
    const specificDiv = document.getElementById(id);
    toggleSidebar() 

    if (specificDiv) {
        Array.from(section.children).forEach(child => {
            child.style.display = "none";
            child.style.opacity = "0";
            child.style.position = "absolute";
        });

        specificDiv.style.display = "block";
        if (id === "draw-lottery-container") {
            specificDiv.style.display = "flex";
        }
        specificDiv.style.opacity = "1";
        specificDiv.style.position = "relative";

        section.style.display = "block";
    } else {
        console.error(`Element with id "${id}" not found.`);
    }
 
    if (id === "custom_admin_dashboard_all_transactions_management") {
        custom_admin_dashboard_transactions_management_function(null, "all_transactions");
    } else if (id === "custom_admin_dashboard_transactions_management_refunded") {
        custom_admin_dashboard_transactions_management_function(null, "refunded");
    }else if (id === "custom_admin_dashboard_prize_management_id") {
        renderPrizeManagementHTML(); 
        fetchWinners(1);
    }else if (id === "draw-lottery-container") {
        custom_admin_dashboard_lottery_draw_winners_management_function();  
    }  else if (id === "custom_admin_dashboard_winners_wall_management_winners_and_testimonials") {
        custom_admin_dashboard_winners_wall_function();
    }
   
    const nav_bar_user_management_button = document.getElementById("user_management_button_id");
    if (id === "custom_admin_dashboard_user_list_table") {
        nav_bar_user_management_button.style.display = "none";

    }

}
//ID:LP-I167-start
var salesChart;
async function report_and_analytics_monthly_sales_bar_chart_exportToExcel() {
    try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js');
        
        const year = document.getElementById('yearSelect').value;
        const month = document.getElementById('monthSelect').value;
        const monthName = month ? document.getElementById('monthSelect').options[document.getElementById('monthSelect').selectedIndex].text : null;
        
        const response = await fetch(`/api/lottery_sales_bar_chart/?year=${year}${month ? `&month=${month}` : ''}`);
        const data = await response.json();
        
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Sales Report");
        
        sheet.mergeCells('A1:B1');
        const titleRow = sheet.getRow(1);
        titleRow.getCell(1).value = month 
            ? `Weekly Sales Report - ${monthName} ${year}`
            : `Monthly Sales Report - ${year}`;
        titleRow.getCell(1).font = { bold: true, size: 13 };
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        titleRow.height = 25;
        
        sheet.mergeCells('A2:B2');
        const filterRow = sheet.getRow(2);
        filterRow.getCell(1).value = `Filters: Year - ${year}${month ? ` | Month - ${monthName}` : ''}`;
        filterRow.getCell(1).font = { italic: true };
        filterRow.getCell(1).alignment = { horizontal: 'center' };
        
        sheet.addRow([]); 
        
        const headerRow = sheet.getRow(4);
        headerRow.values = [
            month ? 'Week Range' : 'Month',
            'Sales Amount (£)'
        ];
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };
        headerRow.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
        });
        
        data.forEach(item => {
            const row = sheet.addRow([
                item.month || item.week,
                item.sales_amount
            ]);
            
            row.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            
            row.getCell(2).numFmt = '£#,##0.00';
        });
        
        sheet.columns = [
            { key: 'period', width: month ? 25 : 15 },
            { key: 'amount', width: 18 }
        ];
        
        const totalAmount = data.reduce((sum, item) => sum + item.sales_amount, 0);
        const totalRow = sheet.addRow([
            'TOTAL',
            totalAmount
        ]);
        totalRow.font = { bold: true };
        totalRow.getCell(2).numFmt = '£#,##0.00';
        totalRow.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: 'double',
                right: { style: 'thin' }
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F0F0' }
            };
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = month 
            ? `Weekly_Sales_${monthName}_${year}.xlsx`
            : `Monthly_Sales_${year}.xlsx`;
        link.click();
    } catch (error) {
        console.error("Error exporting sales report:", error);
        alert("Error exporting sales report. Please try again.");
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
// report_and_analytics_monthly_sales_bar_chart_function 
function report_and_analytics_monthly_sales_bar_chart_function() {
    const custom_admin_dashboard_report_and_analytics_monthly_sales_bar_chart_container = document.getElementById("report_and_analytics_monthly_sales_bar_chart");
    custom_admin_dashboard_report_and_analytics_monthly_sales_bar_chart_container.innerHTML = `
     <div id="custom_admin_dashboard_bar_chart_filter">
        <h1>Monthly/Weekly Sales Chart</h1>
        <div class="filter-controls">
            <div class="filter-group">
                <label for="yearSelect">Select Year:</label>
                <select id="yearSelect"></select>
            </div>
            <div class="filter-group">
                <label for="monthSelect">Select Month:</label>
                <select id="monthSelect">
                    <option value="">All Months</option>
                </select>
            </div>
            <button onclick="report_and_analytics_monthly_sales_bar_chart_exportToExcel()">Export</button>
        </div>
    </div>
    <div class="admin-dashboard-report-container" style="width: 50%;height: 50%;">
        <canvas class="admin-dashboard-report" id="salesChart" width="800" height="400"></canvas>
    </div>
     `;
}

//    custom_admin_dashboard.html (adminpanel template)
//    PaymentLottery table (models.py)
//    lottery_sales_bar_chart_View function (views.py)
function report_and_analytics_sales_chart_fetchSalesData(year, month = null) {
    $.ajax({
        url: `/api/lottery_sales_bar_chart/`,
        method: 'GET',
        data: { year: year, month: month },
        success: function (data) {
            const labels = data.map(item => item.month || item.week);
            const salesamount = data.map(item => item.sales_amount);

            if (salesChart) {
                salesChart.data.labels = labels;
                salesChart.data.datasets[0].data = salesamount;
                salesChart.data.datasets[0].label = month ? 'Weekly Sales' : 'Monthly Sales';
                salesChart.options.scales.x.title.text = month ? 'Weeks' : 'Months';
                salesChart.update();
            } else {
                const ctx = document.getElementById('salesChart').getContext('2d');
                salesChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: month ? 'Weekly Sales' : 'Monthly Sales',
                            data: salesamount,
                            backgroundColor: 'rgba(255, 87, 34, 0.8)', 
                            borderColor: 'rgba(255, 87, 34, 1)',
                            borderWidth: 0, 
                            borderRadius: 8,
                            barPercentage: 0.6, 
                            hoverBackgroundColor: 'rgba(255, 87, 34, 1)' 
                        }]
                    },
                    options: {
                        responsive: true,
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        hover: {
                            mode: 'index',
                            intersect: false
                        },
                        plugins: {
                            legend: {
                                display: false 
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                padding: 10,
                                cornerRadius: 4,
                                callbacks: {
                                    label: function(context) {
                                        return `${context.dataset.label}: £${context.raw.toFixed(2)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: month ? 'Weeks' : 'Months', 
                                    color: '#555',
                                    font: {
                                        size: 14,
                                        weight: 'bold'
                                    }
                                },
                                grid: {
                                    display: false 
                                },
                                ticks: {
                                    color: '#888', 
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    }
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Lottery Sales (£)', 
                                    color: '#555',
                                    font: {
                                        size: 14,
                                        weight: 'bold'
                                    }
                                },
                                grid: {
                                    color: 'rgba(200, 200, 200, 0.3)' 
                                },
                                ticks: {
                                    beginAtZero: true,
                                    color: '#888',
                                    font: {
                                        size: 12
                                    },
                                    callback: function(value) {
                                        return '£' + value;
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
//    custom_admin_dashboard.html (adminpanel template)
//    PaymentLottery table (models.py)
//    lottery_sales_availableYearsView function (views.py)
function report_and_analytics_sales_chart_populateYearDropdown() {
    $.ajax({
        url: `/api/lottery_sales_available_years/`,
        method: 'GET',
        success: function (data) {
            const years = data.years;
            const yearSelect = $("#yearSelect");
            const currentYear = new Date().getFullYear();

            yearSelect.empty();

            years.forEach(year => {
                yearSelect.append(new Option(year, year));
            });

            const defaultYear = years.includes(currentYear) ? currentYear : years[0];
            yearSelect.val(defaultYear);

            report_and_analytics_sales_chart_populateMonthDropdown(defaultYear);
            
            report_and_analytics_sales_chart_fetchSalesData(defaultYear);
        },
        error: function (error) {
            console.error('Error fetching available years:', error);
            alert('Failed to fetch years.');
        }
    });
}

function report_and_analytics_sales_chart_populateMonthDropdown(year) {
    $.ajax({
        url: `/api/lottery_sales_available_months/`,
        method: 'GET',
        data: { year: year },
        success: function (data) {
            const monthSelect = $("#monthSelect");
            monthSelect.empty();
            monthSelect.append('<option value="">All Months</option>');
            
            data.months.forEach(month => {
                monthSelect.append(new Option(month.name, month.number));
            });
        },
        error: function (error) {
            console.error('Error fetching available months:', error);
            alert('Failed to fetch months.');
        }
    });
}

function dynamic_lottery_sales_bar_chart() {
    report_and_analytics_sales_chart_populateYearDropdown();

    $("#yearSelect").on("change", function () {
        const selectedYear = $(this).val();
        report_and_analytics_sales_chart_populateMonthDropdown(selectedYear);
        report_and_analytics_sales_chart_fetchSalesData(selectedYear);
    });

    $("#monthSelect").on("change", function () {
        const selectedYear = $("#yearSelect").val();
        const selectedMonth = $(this).val();
        report_and_analytics_sales_chart_fetchSalesData(selectedYear, selectedMonth || null);
    });
}
//ID:LP-I167-End
function toggleSidebar() {
    const sidebar = document.querySelector(".custom_admin_dashboard_sidebar");
    const hamburger = document.getElementById("custom_admin_dashboard_hamburger_menu_id");
    sidebar.classList.toggle("show");
    if (sidebar.classList.contains("show")) {
        hamburger.innerHTML = "✖"; 
    } else {
        hamburger.innerHTML = "☰"; 
    }
}
function hidetoggleSidebar() {
    const sidebar = document.querySelector(".custom_admin_dashboard_sidebar");
    const hamburger = document.getElementById("custom_admin_dashboard_hamburger_menu_id");


    sidebar.classList.remove("show");


    if (sidebar.classList.contains("show")) {
        hamburger.innerHTML = "✖"; 
    } else {
        hamburger.innerHTML = "☰"; 
    }
}

//ID:LP-I167-start
function report_and_analytics_Pending_vs_completed_draws_pie_chart_function() {
    fetch('/api/report_and_analytics_Pending_vs_completed_draws_pie_chart/')  
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('report_and_analytics_Pending_vs_completed_draws_pie_chart');
            
          
            container.innerHTML = '';
             
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'report_and_analytics_Pending_vs_completed_draws_pie_chart_header';
            
            const heading = document.createElement('h3');
            heading.textContent = 'Pending vs Completed Draws';
            
            const exportBtn = document.createElement('button');
            exportBtn.className = 'report_and_analytics_Pending_vs_completed_draws_pie_chart_export_btn';
            exportBtn.textContent = 'Export';
            exportBtn.onclick = report_and_analytics_Pending_vs_completed_draws_pie_chart_export_function;
            
            headerDiv.appendChild(heading);
            headerDiv.appendChild(exportBtn);
            container.appendChild(headerDiv);
            
            const chartContainer = document.createElement('div');
            chartContainer.className = 'report_and_analytics_Pending_vs_completed_draws_pie_chart_container';
            
            const canvas = document.createElement('canvas');
            canvas.id = 'report_and_analytics_Pending_vs_completed_draws_pie_chart_canvas';
            chartContainer.appendChild(canvas);
            container.appendChild(chartContainer);
            
            const legendDiv = document.createElement('div');
            legendDiv.className = 'report_and_analytics_Pending_vs_completed_draws_pie_chart_legend';
            
            const completedLegend = document.createElement('div');
            completedLegend.className = 'report_and_analytics_Pending_vs_completed_draws_pie_chart_legend_item';
            completedLegend.innerHTML = '<span class="report_and_analytics_Pending_vs_completed_draws_pie_chart_legend_color" style="background-color: #c75205;"></span> Completed Draws: ' + data.completed_draws;
            
            const pendingLegend = document.createElement('div');
            pendingLegend.className = 'report_and_analytics_Pending_vs_completed_draws_pie_chart_legend_item';
            pendingLegend.innerHTML = '<span class="report_and_analytics_Pending_vs_completed_draws_pie_chart_legend_color" style="background-color: #FF6600;"></span> Pending Draws: ' + data.pending_draws;
            
            legendDiv.appendChild(completedLegend);
            legendDiv.appendChild(pendingLegend);
            container.appendChild(legendDiv);
            
            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: [
                        `Completed Draws (${data.completed_draws_percentage}%)`, 
                        `Pending Draws (${data.pending_draws_percentage}%)`
                    ],
                    datasets: [{
                        data: [data.completed_draws, data.pending_draws],
                        backgroundColor: ['#c75205', '#FF6600'],
                        border:'none',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false 
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching draw statistics:', error);
            const container = document.getElementById('report_and_analytics_Pending_vs_completed_draws_pie_chart');
            container.innerHTML = '<p class="report_and_analytics_Pending_vs_completed_draws_pie_chart_error">Error loading draw statistics</p>';
        });
}

//    custom_admin_dashboard.html (adminpanel template)
//    Winner,LotteryEvent table (models.py)
//    api_report_and_analytics_Pending_vs_completed_draws_pie_chart function (views.py)
function report_and_analytics_Pending_vs_completed_draws_pie_chart_export_function() {
    fetch('/api/report_and_analytics_Pending_vs_completed_draws_pie_chart/')
        .then(response => response.json())
        .then(data => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Draws Report');
            
            worksheet.mergeCells('A1:B1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'Pending vs Completed Draws';
            titleCell.font = {
                bold: true,
                size: 13,
                color: { argb: 'FFFFFFFF' }
            };
            titleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4e73df' } 
            };
            titleCell.alignment = { 
                vertical: 'middle', 
                horizontal: 'center' 
            };
            titleCell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            
            worksheet.addRow([]);
            
            const headers = ['Status', 'Count'];
            const headerRow = worksheet.addRow(headers);
            
            headerRow.eachCell((cell) => {
                cell.font = {
                    bold: true,
                    color: { argb: 'FFFFFFFF' }
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1cc88a' } 
                };
                cell.alignment = { 
                    vertical: 'middle', 
                    horizontal: 'center' 
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            
            const dataRows = [
                ['Completed Draws', data.completed_draws],
                ['Pending Draws', data.pending_draws]
            ];
            
            dataRows.forEach(rowData => {
                const row = worksheet.addRow(rowData);
                
                row.eachCell((cell) => {
                    cell.alignment = { 
                        vertical: 'middle', 
                        horizontal: 'center' 
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });
            
            worksheet.getColumn(1).width = 20;
            worksheet.getColumn(2).width = 15;
            
            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Pending_vs_Completed_Draws_Report.xlsx';
                a.click();
                window.URL.revokeObjectURL(url);
            });
        })
        .catch(error => {
            console.error('Error exporting draw statistics:', error);
            alert('Error exporting report');
        });
}



//    custom_admin_dashboard.html (adminpanel template)
//    Winner,PaymentLottery table (models.py)
//    WinnersVsLosersChartAPI function (views.py)
function report_and_analytics_winners_vs_losers_chart_function() {
    const container = document.getElementById('report_and_analytics_winners_vs_losers_chart');
    if (!container) return;

    fetch('/api/winners-vs-losers-chart/')
        .then(response => response.json())
        .then(data => {
            container.innerHTML = '';
            
            const header = document.createElement('div');
            header.className = 'report_and_analytics_winners_vs_losers_chart_header';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.style.marginBottom = '20px';
            
            const title = document.createElement('h2');
            title.textContent = 'Number of Winners Week';
            title.style.margin = '0';
            
            const exportBtn = document.createElement('button');
            exportBtn.textContent = 'Export';
            exportBtn.className = 'report_and_analytics_winners_vs_losers_chart_export_btn';
            exportBtn.style.padding = '8px 16px';
            exportBtn.style.backgroundColor = '#fffefd';
            exportBtn.style.color = 'black';
            exportBtn.style.border = '1px solid rgba(0,0,0,0.5)';
            exportBtn.style.borderRadius = '4px';
            exportBtn.style.cursor = 'pointer';
            exportBtn.style.fontWeight="bold";

            exportBtn.onclick = report_and_analytics_winners_vs_losers_chart_export_function;
            
            header.appendChild(title);
            header.appendChild(exportBtn);
            container.appendChild(header);
            
            const todayCounts = document.createElement('div');
            todayCounts.style.display = 'flex';
            todayCounts.style.marginBottom = '20px';
            todayCounts.style.gap = '20px';
            
            const winnersDiv = document.createElement('div');
            winnersDiv.innerHTML = `
                <div style="font-weight: bold;">Today Winners</div>
                <div style="font-size: 24px;">${data.today_winners} <span style="color: green; font-size: 14px;">↑</span></div>
            `;
            
            const losersDiv = document.createElement('div');
            losersDiv.innerHTML = `
                <div style="font-weight: bold;">Today Losers</div>
                <div style="font-size: 24px;">${data.today_losers} <span style="color: red; font-size: 14px;">↓</span></div>
            `;
            
            todayCounts.appendChild(winnersDiv);
            todayCounts.appendChild(losersDiv);
            container.appendChild(todayCounts);
            
            const chartContainer = document.createElement('div');
            chartContainer.style.position = 'relative';
            chartContainer.style.height = '135px';
            chartContainer.style.marginBottom = '30px';
            container.appendChild(chartContainer);
            
            const labels = data.weekly_data.map(item => item.date);
            const winnersData = data.weekly_data.map(item => item.winners);
            const losersData = data.weekly_data.map(item => item.losers);
            
            const ctx = document.createElement('canvas');
            chartContainer.appendChild(ctx);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Winners',
                            data: winnersData,
                            borderColor: '#FF6600',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.1,
                            fill: true
                        },
                        {
                            label: 'Losers',
                            data: losersData,
                            borderColor: '#c75205',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.1,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value;
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        },
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
            
            const totalsDiv = document.createElement('div');
            totalsDiv.style.display = 'flex';
            totalsDiv.style.gap = '20px';
            totalsDiv.style.marginTop = '20px';
            
            const totalWinners = document.createElement('div');
            totalWinners.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <div style="width: 10px; height: 10px; background-color: #FF6600; margin-right: 5px;"></div>
                    <span>Winners (${data.total_winners})</span>
                </div>
            `;
            
            const totalLosers = document.createElement('div');
            totalLosers.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <div style="width: 10px; height: 10px; background-color: #c75205; margin-right: 5px;"></div>
                    <span>Looser (${data.total_losers})</span>
                </div>
            `;
            
            totalsDiv.appendChild(totalWinners);
            totalsDiv.appendChild(totalLosers);
            container.appendChild(totalsDiv);
        })
        .catch(error => {
            console.error('Error fetching winners vs losers chart data:', error);
            container.innerHTML = '<p>Error loading chart data</p>';
        });
}

//    custom_admin_dashboard.html (adminpanel template)
//    Winner,PaymentLottery table (models.py)
//    WinnersVsLosersChartAPI function (views.py)
function report_and_analytics_winners_vs_losers_chart_export_function() {
    fetch('/api/winners-vs-losers-chart/')
        .then(response => response.json())
        .then(data => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Winners vs Losers');
            
            worksheet.mergeCells('A1:C1');
            const titleRow = worksheet.getCell('A1');
            titleRow.value = 'Number of Winners and Losers Report';
            titleRow.font = {
                bold: true,
                size: 13,
                color: { argb: 'FFFFFFFF' }
            };
            titleRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4F81BD' }
            };
            titleRow.alignment = { 
                vertical: 'middle', 
                horizontal: 'center' 
            };
            titleRow.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            
            worksheet.mergeCells('A3:B3');
            const todayTitle = worksheet.getCell('A3');
            todayTitle.value = "Today's Count";
            applySectionHeaderStyle(todayTitle);
            
            worksheet.getCell('A4').value = 'Today Winners:';
            worksheet.getCell('B4').value = data.today_winners;
            worksheet.getCell('A5').value = 'Today Losers:';
            worksheet.getCell('B5').value = data.today_losers;
            
            worksheet.mergeCells('A7:B7');
            const weeklyTitle = worksheet.getCell('A7');
            weeklyTitle.value = "Weekly Totals";
            applySectionHeaderStyle(weeklyTitle);
            
            worksheet.getCell('A8').value = 'Total Winners:';
            worksheet.getCell('B8').value = data.total_winners;
            worksheet.getCell('A9').value = 'Total Losers:';
            worksheet.getCell('B9').value = data.total_losers;
            
            worksheet.mergeCells('A11:C11');
            const dailyTitle = worksheet.getCell('A11');
            dailyTitle.value = "Daily Breakdown (Last 7 Days)";
            applySectionHeaderStyle(dailyTitle);
            
            worksheet.getCell('A12').value = 'Date';
            worksheet.getCell('B12').value = 'Winners';
            worksheet.getCell('C12').value = 'Losers';
            
            ['A12', 'B12', 'C12'].forEach(cellAddress => {
                const cell = worksheet.getCell(cellAddress);
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD9D9D9' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { 
                    vertical: 'middle', 
                    horizontal: 'center' 
                };
            });
            
            data.weekly_data.forEach((dayData, index) => {
                const row = 13 + index;
                worksheet.getCell(`A${row}`).value = dayData.date;
                worksheet.getCell(`B${row}`).value = dayData.winners;
                worksheet.getCell(`C${row}`).value = dayData.losers;
                
                [`A${row}`, `B${row}`, `C${row}`].forEach(cellAddress => {
                    const cell = worksheet.getCell(cellAddress);
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    
                    if (cellAddress.startsWith('B') || cellAddress.startsWith('C')) {
                        cell.alignment = { horizontal: 'right' };
                    }
                });
            });
            
            worksheet.columns = [
                { key: 'date', width: 20 },
                { key: 'winners', width: 12 },
                { key: 'losers', width: 12 }
            ];
            
            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'winners_vs_losers_report.xlsx';
                link.click();
                URL.revokeObjectURL(link.href);
            });
        })
        .catch(error => {
            console.error('Error exporting report:', error);
            alert('Error exporting report');
        });
}

function applySectionHeaderStyle(cell) {
    cell.font = {
        bold: true,
        size: 14,
        color: { argb: 'FFFFFFFF' }
    };
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7B7B7B' }
    };
    cell.alignment = { 
        vertical: 'middle', 
        horizontal: 'left' 
    };
    cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };
}
//    custom_admin_dashboard.html (adminpanel template)
//    PaymentLottery table (models.py)
//    OverallTransactionReportView function (views.py)
// report_and_analytics_overall_transaction_report_chart_function
function report_and_analytics_overall_transaction_report_chart_function() {
    const container = document.getElementById('report_and_analytics_overall_transaction_report_chart');
    if (!container) return;

    fetch('/api/report_and_analytics/overall_transaction_report/')
        .then(response => response.json())
        .then(data => {
            container.innerHTML = `
                <div class="report_and_analytics_overall_transaction_report_chart_header_class">
                    <h2>Overall Transaction Report</h2>
                    <button class="report_and_analytics_overall_transaction_report_chart_export_button_class" 
                            onclick="report_and_analytics_overall_transaction_report_chart_export_function()">
                        Export
                    </button>
                </div>
                <div class="report_and_analytics_overall_transaction_report_chart_amount_class">
                    Current Month: ${data.current_month} <span>${data.current_amount}</span>
                </div>
                <div class="report_and_analytics_overall_transaction_report_chart_canvas_container_class">
                    <canvas id="report_and_analytics_overall_transaction_report_chart_canvas"></canvas>
                </div>
                <div class="report_and_analytics_overall_transaction_report_chart_legend_class">
                    <div><span class="report_and_analytics_overall_transaction_report_chart_successful_class"></span> Successful</div>
                    <div><span class="report_and_analytics_overall_transaction_report_chart_refunded_class"></span> Refunded</div>
                </div>
            `;

            const ctx = document.getElementById('report_and_analytics_overall_transaction_report_chart_canvas').getContext('2d');
            window.report_and_analytics_overall_transaction_report_chart_instance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.months,
                    datasets: [
                        {
                            label: 'Successful',
                            data: data.successful,
                            borderColor: '#4CAF50',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Refunded',
                            data: data.refunded,
                            borderColor: '#F44336',
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: £${context.raw.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '£' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching transaction report data:', error);
            container.innerHTML = '<p>Error loading transaction report data</p>';
        });
}


//    custom_admin_dashboard.html (adminpanel template)
//    PaymentLottery table (models.py)
//    OverallTransactionReportView function (views.py)
// report_and_analytics_overall_transaction_report_chart_export_function  Export function to Excel with raw data table 
async function report_and_analytics_overall_transaction_report_chart_export_function() {
    try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js');
        
        const response = await fetch('/api/report_and_analytics/overall_transaction_report/');
        const data = await response.json();
        
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Transaction Report");
        
        sheet.mergeCells('A1:D1');
        const titleRow = sheet.getRow(1);
        titleRow.getCell(1).value = 'Overall Transaction Report';
        titleRow.getCell(1).font = { bold: true, size: 16 };
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        titleRow.height = 25;
        
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
        const currentYear = currentDate.getFullYear();
        
        sheet.mergeCells('A2:D2');
        const subtitleRow = sheet.getRow(2);
        subtitleRow.getCell(1).value = `Current Period: ${currentMonth} ${currentYear} | Net Profit: ${data.current_amount}`;
        subtitleRow.getCell(1).font = { bold: true };
        subtitleRow.getCell(1).alignment = { horizontal: 'center' };
        subtitleRow.height = 20;
        
        sheet.addRow([]);
        
        const headerRow = sheet.getRow(4);
        headerRow.values = ['Month', 'Successful (£)', 'Refunded (£)', 'Net (£)'];
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };
        headerRow.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
        });
        
        data.months.forEach((month, index) => {
            const successful = data.successful[index] || 0;
            const refunded = data.refunded[index] || 0;
            const net = successful - refunded;
            
            const row = sheet.addRow([
                month,
                successful.toLocaleString('en-GB', { minimumFractionDigits: 2 }),
                refunded.toLocaleString('en-GB', { minimumFractionDigits: 2 }),
                net.toLocaleString('en-GB', { minimumFractionDigits: 2 })
            ]);
            
            row.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                if (cell.col === 4) { 
                    cell.font = { bold: true };
                    cell.numFmt = '£#,##0.00;[Red]-£#,##0.00';
                }
            });
            
            if (month === currentMonth.slice(0, 3)) {
                row.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF0F0F0' }
                    };
                });
            }
        });
        
        sheet.columns = [
            { key: 'month', width: 15 },
            { key: 'successful', width: 18 },
            { key: 'refunded', width: 18 },
            { key: 'net', width: 18 }
        ];
        
        for (let i = 5; i <= sheet.rowCount; i++) {
            sheet.getCell(`B${i}`).numFmt = '£#,##0.00';
            sheet.getCell(`C${i}`).numFmt = '£#,##0.00';
            sheet.getCell(`D${i}`).numFmt = '£#,##0.00;[Red]-£#,##0.00';
        }
        
       
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Overall_Transaction_Report_${currentMonth}_${currentYear}.xlsx`;
        link.click();
    } catch (error) {
        console.error("Error exporting report:", error);
        alert("Error exporting report. Please try again.");
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}



// report_and_analytics_marginal_chart_function 
//    custom_admin_dashboard.html (adminpanel template)
//    LotteryEvent,PaymentLottery,LotteryCategory table (models.py)
//    MarginalChartDataView function (views.py)
function report_and_analytics_marginal_chart_function(marginal_year, marginal_month) {
    const container = document.getElementById('report_and_analytics_marginal_chart');
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    fetch(`/api/marginal-chart-data/?year=${marginal_year}&month=${marginal_month}`)
        .then(response => response.json())
        .then(data => {
            renderMarginalChart(data);
        })
        .catch(error => {
            console.error('Error:', error);
            container.innerHTML = '<div class="alert alert-danger">Failed to load chart data</div>';
        });
}

function renderMarginalChart(data) {
    const container = document.getElementById('report_and_analytics_marginal_chart');
    
    let html = `
        <div class="report_and_analytics_marginal_chart_header_class">
            <h3 class="report_and_analytics_marginal_chart_heading_class">Margin Chart</h3>
            <button class="admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_export_button_class" 
                    onclick="report_and_analytics_marginal_chart_export_function()">
                Export
            </button>
        </div>
        <div class="report_and_analytics_marginal_chart_filters_class mb-3">
            <select id="report_and_analytics_marginal_chart_year_select" class="form-select-sm">
                ${data.years.map(year => `<option value="${year}" ${year == data.selected_year ? 'selected' : ''}>${year}</option>`).join('')}
            </select>
            <select id="report_and_analytics_marginal_chart_month_select" class="form-select-sm">
                ${data.months.map(month => `<option value="${month.value}" ${month.value == data.selected_month ? 'selected' : ''}>${month.name}</option>`).join('')}
            </select>
        </div>
        <div class="report_and_analytics_marginal_chart_container_class">
            <div class="report_and_analytics_marginal_chart_canvas_container_class">
                <canvas id="report_and_analytics_marginal_chart_canvas" height="300"></canvas>
            </div>
            <div class="report_and_analytics_marginal_chart_summary_class">
                <div class="summary-item">
                    <span class="summary-label">Total Sales:</span>
                    <span class="summary-value">£${data.overall.total_sales.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                     <span class="summary-label">Margin:</span>
                    <span class="summary-value ${data.overall.margin >= 0 ? 'text-success' : 'text-danger'}">
                        £${Math.abs(data.overall.margin).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        (${data.overall.margin >= 0 ? '+' : '-'})
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Target:</span>
                    <span class="summary-value">£${data.overall.total_target.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="summary-label">Status:</span>
                    <span class="summary-value ${data.overall.margin_status === 'Reached' ? 'text-success' : 'text-danger'}">
                        ${data.overall.margin_status}
                    </span>
                </div>
               
            </div>
        </div>
        <div class="report_and_analytics_marginal_chart_legend_class mt-3">
            <div><span class="legend-color sales"></span> Sales</div>
            <div><span class="legend-color target"></span> Target</div>
            <div><span class="legend-color reached"></span> Margin Reached</div>
            <div><span class="legend-color not-reached"></span> Margin Not Reached</div>
        </div>
    `;
    
    container.innerHTML = html;
    
    document.getElementById('report_and_analytics_marginal_chart_year_select').addEventListener('change', function() {
        const year = this.value;
        const monthSelect = document.getElementById('report_and_analytics_marginal_chart_month_select');
        monthSelect.innerHTML = data.months.map(month => 
            `<option value="${month.value}">${month.name}</option>`
        ).join('');
        report_and_analytics_marginal_chart_function(year, 'all');   
    });
    
    document.getElementById('report_and_analytics_marginal_chart_month_select').addEventListener('change', function() {
        const year = document.getElementById('report_and_analytics_marginal_chart_year_select').value;
        const month = this.value;
        report_and_analytics_marginal_chart_function(year, month);
    });
    
    if (data.data && data.data.length > 0) {
        marginal_renderChart(data.data);
    } else {
        container.innerHTML += '<div class="alert alert-info mt-3">No data available for the selected period</div>';
    }
}

function marginal_renderChart(chartData) {
    const ctx = document.getElementById('report_and_analytics_marginal_chart_canvas').getContext('2d');
    
    const categories = chartData.map(item => item.category);
    const salesData = chartData.map(item => item.total_sales);
    const targetData = chartData.map(item => item.total_amount);
    const marginData = chartData.map(item => item.margin);
    const backgroundColors = chartData.map(item => item.margin_reached ? 'rgba(28, 200, 138, 0.7)' : 'rgba(231, 74, 59, 0.7)');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
    {
        label: 'Sales',
        data: salesData,
        backgroundColor: 'rgba(255, 184, 34, 0.7)',
        borderColor: 'rgba(255, 184, 34, 1)',
        borderWidth: 1,
        barPercentage: 0.6,
        categoryPercentage: 0.8
    },
    {
        label: 'Target',
        data: targetData,
        backgroundColor: 'rgba(224, 75, 75, 0.7)',
        borderColor: 'rgba(224, 75, 75, 1)',
        borderWidth: 1,
        barPercentage: 0.6,
        categoryPercentage: 0.8
    }

            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {

                mode: 'index',

                intersect: false

            },

            hover: {

                mode: 'index',

                intersect: false

            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y.toLocaleString('en-US', {style: 'currency', currency: 'GBP'});
                            return label;
                        },
                        afterLabel: function(context) {
                            const dataIndex = context.dataIndex;
                            const margin = marginData[dataIndex];
                            const status = margin >= 0 ? 'Reached' : 'Not Reached';
                            return [
                                `Margin: ${margin.toLocaleString('en-US', {style: 'currency', currency: 'GBP'})}`,
                                `Status: ${status}`
                            ];
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '£' + value.toLocaleString('en-US');
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
//    custom_admin_dashboard.html (adminpanel template)
//    LotteryCategory,PaymentLottery,LotteryEvent table (models.py)
//    MarginalChartExportView function (views.py)
function report_and_analytics_marginal_chart_export_function() {
    const year = document.getElementById('report_and_analytics_marginal_chart_year_select').value;
    const month = document.getElementById('report_and_analytics_marginal_chart_month_select').value;
    
    window.location.href = `/api/marginal-chart-export/?year=${year}&month=${month}`;
}


// admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_function
//    custom_admin_dashboard.html (adminpanel template)
//    Winner table (models.py)
//    overall_won_and_lost_lotteries_report_LotteryReportAPI function (views.py)
function admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_function() {
    const container = document.getElementById('admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart');
    fetch('/api/overall_won_and_lost_lotteries_report_LotteryReportAPI/')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                container.innerHTML = `
        <div class="admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_header_class">
            <h3>Overall Won and Lost Lotteries Report</h3>
            <button onclick="admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_export_function()" 
                    class="admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_export_button_class">
                Export
            </button>
        </div>
        <div class="admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_legend_class">
            <span class="admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_legend_won_class">
                <span class="admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_legend_color_class" style="background-color: #F69B08;"></span> Won : ${data.total_won}
            </span>
            <span class="admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_legend_lost_class">
                <span class="admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_legend_color_class" style="background-color: #FF6600;"></span> Lost : ${data.total_lost}
            </span>
            </span>
        </div>
        <div class="admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_canvas_container_class">
            <canvas id="admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_canvas"></canvas>
        </div>
    `;
                renderChart(data);
                
            } else {
                container.innerHTML += '<p>Error loading data</p>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            container.innerHTML += '<p>Error loading data</p>';
        });
    
    function renderChart(data) {
        const years = data.years_data.map(item => item.year.toString());
        const wonData = data.years_data.map(item => item.won);
        const lostData = data.years_data.map(item => item.lost);
        
        const ctx = document.getElementById('admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_canvas').getContext('2d');
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Won',
                        data: wonData,
                        backgroundColor: '#F69B08',
                        borderColor: '#F69B08',
                        borderWidth: 1
                    },
                    {
                        label: 'Lost',
                        data: lostData,
                        backgroundColor: '#FF6600',
                        borderColor: '#FF6600',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },

            interaction: {

                mode: 'index',

                intersect: false

            },

            hover: {

                mode: 'index',

                intersect: false

            },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterBody: function(context) {
                                const datasetIndex = context[0].datasetIndex;
                                const dataIndex = context[0].dataIndex;
                                const value = context[0].parsed.y;
                                const year = years[dataIndex];
                                
                                if (datasetIndex === 0) {
                                    return `Year: ${year}\nTotal Won: ${value}`;
                                } else {
                                    return `Year: ${year}\nTotal Lost: ${value}`;
                                }
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

// admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_export_function
// admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_function
//    custom_admin_dashboard.html (adminpanel template)
//    Winner table (models.py)
//    overall_won_and_lost_lotteries_report_LotteryReportExportAPI function (views.py)
function admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_export_function() {
    const link = document.createElement('a');
    link.href = '/api/overall_won_and_lost_lotteries_report_LotteryReportExportAPI/';
    link.download = 'Lottery_Report.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
//ID:LP-I167-End
//    custom_admin_dashboard.html (adminpanel template)
//    adminProfile,UserProfile,LotteryEvent,PaymentLottery table (models.py)
//    api_dashboard_preview_admin_view,api_navbar_access_tabsView function (views.py)
//ID:LP-I66-start
function initializeDashboard() {
    try {

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
                        sidebar.innerHTML = ""; 
                        data.forEach(tab => {
                            const li = document.createElement("li");
                            let active = tab.identifier === null ? "active" : "";

                            let imageHtml = "";
                            if (tab.nav_bar_image_url) {
                                imageHtml = `<img src="${tab.nav_bar_image_url}" alt="${tab.name}" class="custom_admin_dashboard_nav_bar_images" style="width: 20px; height: 20px; margin-left: 15px;">`;
                            }

                            li.innerHTML = `
                                <a href="${tab.resolved_url}" class="sidebars ${active}" id="${tab.identifier}_navbar" onclick="showSpecificDiv('${tab.identifier}')">
                                    ${imageHtml}</br> ${tab.name}
                                </a>
                            `;
                            sidebar.appendChild(li);
                        });

                        $(".sidebars").click(function () {
                            $(".sidebars").removeClass('active');
                            $(this).addClass('active');
                        });
                    } catch (error) {
                        console.error("Error processing sidebar data:", error);
                    }
                })
                .catch(error => console.error("Error fetching tabs:", error));

            fetch(api_dashboard_preview_admin_view_url)
                .then(response => response.json())
                .then(({ data, tabs }) => {
                    try {

                        tabs.forEach(tab => {
                           
                            try {
                               if (tab.type === 'overview_counts') {
                                    const custom_admin_dashboard_overview_lottery_won_lost_count = document.getElementById("custom_admin_dashboard_overview_lottery_won_lost_count");
                                    const lottery_won_lost_container = document.createElement('div');
                                    lottery_won_lost_container.className = 'overview_sales_count_card';
                                    const imageHtml = tab.image_url
                                        ? `<img src="${tab.image_url}" alt="${tab.name}" class="dashboard-preview-image" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">`
                                        : '';
                                    lottery_won_lost_container.innerHTML = `
                                                 
                                                <p>${imageHtml} ${tab.name}</p>
                                                <h2 id="${tab.identifier}">${data[tab.identifier] || 0}</h2> 
                                        `;
                                    custom_admin_dashboard_overview_lottery_won_lost_count.appendChild(lottery_won_lost_container);
                                }  else if (tab.type === 'charts') {
                                    if (tab.identifier === 'admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart') {
                                         admin_dashboard_overview_overall_won_and_lost_lotteries_report_chart_function();
                                    } else if (tab.identifier === 'report_and_analytics_marginal_chart') {
                                        const currentDate = new Date();
                                        report_and_analytics_marginal_chart_function(currentDate.getFullYear(), 'all');
                                    } else if (tab.identifier === 'report_and_analytics_monthly_sales_bar_chart') {
                                        report_and_analytics_monthly_sales_bar_chart_function();
                                        dynamic_lottery_sales_bar_chart(); 
                                    } else if (tab.identifier === 'report_and_analytics_Pending_vs_completed_draws_pie_chart') {
                                        report_and_analytics_Pending_vs_completed_draws_pie_chart_function();
                                    } else if (tab.identifier === 'report_and_analytics_winners_vs_losers_chart') {
                                        report_and_analytics_winners_vs_losers_chart_function();
                                    } else if (tab.identifier === 'report_and_analytics_overall_transaction_report_chart') {
                                        report_and_analytics_overall_transaction_report_chart_function();
                                    } 
                
                                } else if (tab.type === 'user_management_table') {
                                    let rows = []; 
                                    let currentPage = 1;
                                    let totalUsers = 0;
                                    let allLoadedUsers = [];
                                    let isInitialLoad = true;
                                    const container = document.querySelector(".custom_admin_dashboard_user_table");
                                    function user_management_table() {
                                        container.innerHTML = `
                                            <span style="font-size: 24px; display: block; margin-bottom: 20px;">
                                                User Management
                                            </span>
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <input 
                                                    type="text" 
                                                    id="searchUserInput" 
                                                    placeholder="Search by username, email, ip, kyc status..." 
                                                />
                                                <select id="filterDropdown" style="padding: 5px; border-radius: 4px; border: 1px solid #ccc;" >
                                                    <option value="All Users">All Users</option>
                                                    <option value="Blocked Users">Blocked Users</option>
                                                </select>
                                            </div>
                                            <table class="custom_admin_dashboard_custom_table">
                                                <thead>
                                                    <tr>
                                                        <th>Account Status</th>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>KYC Image</th>
                                                        <th>IP Address</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="userTableBody"></tbody>
                                            </table>
                                            <h3 id="noUserMessage" class="noUserMessage_class">user not found</h3>
                                            <div id="userCountContainer" style="margin-top: 10px;"></div>
                                            <button 
                                                id="user_management_button_id" 
                                                class="user_management_button_class" 
                                            > user management
                                            </button>
                                            <button 
                                                id="viewMoreButton" 
                                                class="view-more-button" 
                                                style="display: none;" 
                                            >
                                                View More
                                            </button>
                                            <button 
                                                id="viewLessButton" 
                                                class="view-less-button" 
                                                style="display: none;"              
                                            >
                                                View Less
                                            </button>
                                        `;
                                        fetchUsers(true);
                                        document.getElementById("user_management_button_id")
                                            .addEventListener("click", user_management_button_function);
                                        document.getElementById("viewMoreButton").addEventListener("click", loadMoreUsers);
                                        document.getElementById("viewLessButton").addEventListener("click", loadLessUsers);
                                        document.getElementById("filterDropdown").addEventListener("change", () => fetchUsers(true));
                                        document.getElementById("searchUserInput").addEventListener("keyup", () => fetchUsers(true));
                                    }
                                    function user_management_button_function() {
                                        showSpecificDiv('custom_admin_dashboard_user_list_table');
                                        $(".sidebars").removeClass('active');
                                        $("#custom_admin_dashboard_user_list_table_navbar").addClass('active');
                                        hidetoggleSidebar();  
                                    }

                                function fetchUsers(resetPagination = false) {
                                    const searchQuery = document.getElementById("searchUserInput").value.trim();
                                    const filterValue = document.getElementById("filterDropdown").value;

                                    if (resetPagination) {
                                        currentPage = 1;
                                        allLoadedUsers = [];
                                    }

                                    const params = new URLSearchParams();
                                    if (searchQuery) params.append("search", searchQuery);
                                    if (filterValue && filterValue !== "All Users") params.append("filter", filterValue);
                                    params.append("page", currentPage);
                                    params.append("per_page", 10); // Fetch 10 users at a time

                                    fetch(`/api/get-users/?${params.toString()}`)
                                        .then(response => response.json())
                                        .then(data => {
                                            const tbody = document.getElementById('userTableBody');
                                            
                                            if (resetPagination) {
                                                tbody.innerHTML = ''; // Clear table on new searches/filters
                                            }

                                            totalUsers = data.total_users;
                                            allLoadedUsers = [...allLoadedUsers, ...data.users];
                                            
                                            if (data.users.length === 0 && isInitialLoad) {
                                                document.getElementById("noUserMessage").style.display = "block";
                                            } else {
                                                document.getElementById("noUserMessage").style.display = "none";
                                                data.users.forEach(row => renderUsers(row));
                                                rows = allLoadedUsers;
                                            }

                                            // Update user count display
                                            document.getElementById("userCountContainer").textContent = 
                                                `Showing ${Math.min(allLoadedUsers.length, totalUsers)} of ${totalUsers} users`;

                                            // Show/hide pagination buttons
                                            updatePaginationButtons(data.has_next);

                                            isInitialLoad = false;
                                        })
                                        .catch(error => {
                                            console.error('Error fetching user data:', error);
                                        });
                                }

                                function updatePaginationButtons(hasMore) {
                                    const viewMoreBtn = document.getElementById("viewMoreButton");
                                    const viewLessBtn = document.getElementById("viewLessButton");
                                    
                                    // Show View More if there are more users to load
                                    viewMoreBtn.style.display = hasMore ? "block" : "none";
                                    
                                    // Show View Less if we've loaded more than the initial page
                                    viewLessBtn.style.display = (allLoadedUsers.length > 10) ? "block" : "none";
                                }

                                function loadMoreUsers() {
                                    currentPage++;
                                    fetchUsers();
                                }

                                function loadLessUsers() {
                                    const tbody = document.getElementById('userTableBody');
                                    // Remove last 10 users (or remaining if less than 10)
                                    const usersToRemove = Math.min(10, allLoadedUsers.length - 10);
                                    
                                    // Update the displayed users
                                    allLoadedUsers = allLoadedUsers.slice(0, -usersToRemove);
                                    tbody.innerHTML = '';
                                    allLoadedUsers.forEach(row => renderUsers(row));
                                    
                                    // Update counters and buttons
                                    document.getElementById("userCountContainer").textContent = 
                                        `Showing ${allLoadedUsers.length} of ${totalUsers} users`;
                                    
                                    currentPage = Math.max(1, currentPage - 1);
                                    updatePaginationButtons(true); // Assume there might be more to load
                                    
                                    // If we're back to initial state, hide View Less
                                    if (allLoadedUsers.length <= 10) {
                                        document.getElementById("viewLessButton").style.display = "none";
                                    }
                                }

                                    function renderUsers(row) {
                                        const tbody = document.getElementById('userTableBody');
                                        const tr = document.createElement('tr');
                                        tr.innerHTML = `
                                                <td>
                                                    <select class="user_kyc_waiting_list-kyc-statusselect " data-user-id="${row.user?.id}" data-status="${row.kyc_status}">
                                                        <option value="waiting" ${row.kyc_status === 'waiting' ? 'selected' : ''}>Waiting</option>
                                                        <option value="verified" ${row.kyc_status === 'verified' ? 'selected' : ''}>Verified</option>
                                                        <option value="rejected" ${row.kyc_status === 'rejected' ? 'selected' : ''}>Rejected</option>
                                                        <option value="pending" ${row.kyc_status === 'pending' ? 'selected' : ''}>Pending</option>
                                                    </select>
                                                </td>
                                                <td class="view_specfic_user_details" data-user-id="${row.user?.id}">
                                                ${row.profile_photo_url
                                                ? `<img src="${row.profile_photo_url}" alt="Profile Image" class="custom_admin_dashboard_user_management_profile_image">`
                                                : ''
                                            }
	                                            ${row.user?.username || 'N/A'}
                                                </td>
                                                <td class="view_specfic_user_details" data-user-id="${row.user?.id}" >${row.user?.email || 'N/A'}</td>
                                                <td>
                                                            ${row.kyc_image_url
                                                ? `<a href="#" class="view-kyc-image" data-imageurl="${row.kyc_image_url}" data-username="${row.user?.username || 'N/A'}" data-email="${row.user?.email || 'N/A'}" data-kycstatus="${row.kyc_status || 'N/A'}">View KYC Image</a>`
                                                : 'KYC not submitted'
                                            }
                                                        </td>                                                
                                                <td>${row.ip_address || 'N/A'}</td>
                                                <td><button class="block-user-btn" data-user-id="${row.user?.id}">${row.is_blocked ? 'Unblock User' : 'Block User'}</button></td>                                            `;
                                        tbody.appendChild(tr);
                                    }
                                    window.goToUserManagement = function() {
                                        showSpecificDiv("custom_admin_dashboard_user_list_table");
                                        hidetoggleSidebar();
                                    };
                                    
                                    let currentUserDetails = null; // Add this at the top of your code

                                    function displayUserDetails(user) {
                                        currentUserDetails = user; 
                                    
                                        const custom_admin_dashboard_user_detail_page_container = document.getElementById("custom_admin_dashboard_user_detail_page");
                                        custom_admin_dashboard_user_detail_page_container.innerHTML = `
                                            <div class="users_management_user_details_page_gotousermanagement">
                                                <span class="user_management_span" onclick="goToUserManagement()">Users Management</span> > <span>User Details</span>
                                            </div>
                                            <div class="users_management_user_details_page_user_details_card">
                                                <div class="users_management_user_details_page_profile_section">
                                                <p>
                                                     <select class="user_kyc_waiting_list-kyc-statusselect" data-user-id="${user.user?.id}" data-status="${user.kyc_status}">
                                                        <option value="waiting" ${user.kyc_status === 'waiting' ? 'selected' : ''}>Waiting</option>
                                                        <option value="verified" ${user.kyc_status === 'verified' ? 'selected' : ''}>Verified</option>
                                                        <option value="rejected" ${user.kyc_status === 'rejected' ? 'selected' : ''}>Rejected</option>
                                                        <option value="pending" ${user.kyc_status === 'pending' ? 'selected' : ''}>Pending</option>
                                                    </select><p>
                                                    <img src="${user.profile_photo_url || ''}" class="users_management_user_details_page_user_profile_image" alt="User Image">
                                                    <h2>${user.user?.username || 'N/A'} </h2>
                                                    <p>${user.user?.email || 'N/A'}</p>
                                                    <p>${user.ip_address || 'N/A'}</p>
                                                    
                                                    <p><button class="block-user-btn" data-user-id="${user.user?.id}">
                                                    <img src="/media/dashboard_preview_image/Frame.png"  alt="Block-Icon class="Block-icon"/>
                                                    ${user.is_blocked ? 'Unblock User' : 'Block User'}</button></p>
                                                    ${user.kyc_image_url ? `<a href="#" class="view-kyc-image" data-imageurl="${user.kyc_image_url}" data-username="${user.user?.username || 'N/A'}" data-email="${user.user?.email || 'N/A'}" data-kycstatus="${user.kyc_status || 'N/A'}">View KYC Image</a>` : 'KYC not submitted'}
                                                </div>
                                            </div>
                                            <div class="user_statistics_title">user statistics</div>
                                            <div class="users_management_user_details_page_user_statistics">
                                           
                                        <div class="users_management_user_details_page_statistic_container">
                                            <img src="/media/dashboard_preview_image/trans.png">
                                            <div>
                                                <h3>Total Number Of Transactions</h3>
                                                <p id="total_number_of_transactions_count_user_details_management">0</p>
                                            </div>
                                        </div>
                                        <div class="users_management_user_details_page_statistic_container">
                                            <img src="/media/dashboard_preview_image/phone.png">
                                            <div>
                                                <h3>Phone Number</h3>
                                                <p>${user.phone_number || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div class="users_management_user_details_page_statistic_container">
                                            <img src="/media/dashboard_preview_image/add.png">
                                            <div>
                                                <h3>Address</h3>
                                                <p>${user.address || 'N/A'}</p>
                                            </div>
                                        </div>
                                        `;
                                    }
                                    $(document).on('change', '.user_kyc_waiting_list-kyc-statusselect', function () {
                                        try {
                                            const userId = $(this).data('user-id'); 
                                            const newStatus = $(this).val();
                                            updateSelectColor($(this), newStatus);
                                            
                                            $.ajax({
                                                url: adminupdaetkycapprovalUrl, 
                                                type: 'POST',
                                                data: JSON.stringify({ user_id: userId, kyc_status: newStatus }),
                                                contentType: 'application/json',
                                                headers: { 'X-CSRFToken': custom_admin_dashboard_csrfToken }, 
                                                success: function (response) {
                                                    // Update in rows array
                                                    const userIndex = rows.findIndex(row => row.user?.id === userId);
                                                    if (userIndex !== -1) {
                                                        rows[userIndex].kyc_status = newStatus;
                                                    }
                                                    
                                                    // Update in current user details if this is the same user
                                                    if (currentUserDetails && currentUserDetails.user?.id === userId) {
                                                        currentUserDetails.kyc_status = newStatus;
                                                    }
                                                    
                                                    // Update the table UI
                                                    $(`.user_kyc_waiting_list-kyc-statusselect[data-user-id="${userId}"]`)
                                                        .val(newStatus)
                                                        .data('status', newStatus);
                                                    updateSelectColor($(`.user_kyc_waiting_list-kyc-statusselect[data-user-id="${userId}"]`), newStatus);

                                                    alert(`KYC status updated to ${newStatus}`);
                                                },
                                                error: function (xhr, status, error) {
                                                    alert(`Failed to update KYC status: ${error}`); 
                                                }
                                            });
                                        } catch (error) {
                                            console.error('Error:', error);
                                            alert('An error occurred while updating the KYC status.');
                                        }
                                    });
                                    
                                    $(document).on('click', '.view_specfic_user_details', function () {
                                        let userId = $(this).data('user-id');
                                        let user = rows.find(row => row.user?.id === userId);
                                        
                                        if (user) {
                                            user_management_button_function();
                                            custom_admin_dashboard_transactions_management_function(user.user.email) 
                                            displayUserDetails(user);
                                            showSpecificDiv("custom_admin_dashboard_user_detail_page");
                                            let user_details_custom_admin_dashboard_transactions_management = document.getElementById("custom_admin_dashboard_transactions_management");
                                            if (user_details_custom_admin_dashboard_transactions_management.style.display === "none") {
                                                user_details_custom_admin_dashboard_transactions_management.style.display = "block";
                                                user_details_custom_admin_dashboard_transactions_management.style.opacity = "1";
                                                user_details_custom_admin_dashboard_transactions_management.style.position = "relative";
                                            }
                                            hidetoggleSidebar();

                                        } else {
                                            console.error("User not found");
                                        }
                                    });
                                    $(document).on('click', '.block-user-btn', function () {
                                        let button = $(this);
                                        let userId = button.data('user-id');
                                        let action = button.text().trim() === "Block User" ? "block" : "unblock";

                                        axios.post('/block-user/',
                                            { user_id: userId, action: action },
                                            { headers: { 'X-CSRFToken': admin_chats_csrfToken } }  
                                        )
                                        .then(response => {
                                            alert(response.data.message);
                                            
                                            // Update button text in both places
                                            button.text(action === "block" ? "Unblock User" : "Block User");
                                            $(`.block-user-btn[data-user-id="${userId}"]`)
                                                .text(action === "block" ? "Unblock User" : "Block User");
                                            
                                            // Update in rows array
                                            const userIndex = rows.findIndex(row => row.user?.id === userId);
                                            if (userIndex !== -1) {
                                                rows[userIndex].is_blocked = action === "block";
                                            }
                                            
                                            // Update in current user details if this is the same user
                                            if (currentUserDetails && currentUserDetails.user?.id === userId) {
                                                currentUserDetails.is_blocked = action === "block";
                                            }
                                            
                                            const filterValue_refetch = document.getElementById("filterDropdown").value;
                                            if (filterValue_refetch === "Blocked Users") {
                                                fetchUsers(true);
                                            }
                                        })
                                        .catch(error => {
                                            alert('Error: ' + (error.response?.data?.detail || 'Something went wrong'));
                                        });
                                    });
                                    user_management_table();

                                } else if (tab.type === 'lotterys') {
                                    const pageTitle = document.getElementById('lottery_card_title');
                                    pageTitle.textContent = tab.name;

                                    const lottery_element = document.querySelector('.custom_admin_dashboard_lottery-events-grid');
                                    if (lottery_element) lottery_element.style.display = 'grid';
                                    const lottery_prevPage_and_nextPage_button = document.getElementById("lottery_prevPage_and_nextPage_button");
                                    if (lottery_prevPage_and_nextPage_button) lottery_prevPage_and_nextPage_button.style.display = 'block';

                                    fetchLotteryEvents();
                                    fetchLotteryCategories();


                                    const lottery_header_filter_containers = document.getElementById("lottery_header_filter-containers");
                                    if (lottery_header_filter_containers) {
                                        lottery_header_filter_containers.removeAttribute("hidden");
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
                                    function add_lottery_draw_date_past_date_validation(){
                                        const lottery_draw_date_input_id = document.getElementById('lottery_draw_date');
                                        if (lottery_draw_date_input_id) {
                                            document.getElementById('lottery_draw_date').min = new Date().toISOString().slice(0, 16);
                                        }
                                    }
                                    add_lottery_draw_date_past_date_validation()
                                } else if (tab.type === 'user_chats_and_notification_bell_icon') {
                                    document.getElementById("notification-bell-container").hidden = false;
                                    admin_chat_view();
                                } else if (tab.type === 'Statistics_count') {
                                    const custom_admin_dashboard_report_and_analytics_statistics_count_container = document.createElement('div');
                                    custom_admin_dashboard_report_and_analytics_statistics_count_container.className = 'custom_admin_dashboard_card';
                                    const custom_admin_dashboard_report_and_analytics_statistics_count = document.getElementById("custom_admin_dashboard_report_and_analytics_statistics_count");
                                    
                                    custom_admin_dashboard_report_and_analytics_statistics_count_container.innerHTML = `
                                            <h2>${tab.name}</h2>
                                            <p id="${tab.identifier}">${data[tab.identifier] || 0}</p>
                                        `;
                                        custom_admin_dashboard_report_and_analytics_statistics_count.appendChild(custom_admin_dashboard_report_and_analytics_statistics_count_container);
                                   
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

    } catch (error) {
        console.error("Error setting up DOMContentLoaded listener:", error);
    }
}
//ID:LP-I66-End

try {
    $(document).on('click', '.view-kyc-image', function (event) {
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

            $('.user_kyc_waiting_list-close-btn').on('click', function () {
                $('#custom_admin_user_kyc_waiting_list-kycModal').hide();
            });

            $(window).on('click', function (event) {
                if ($(event.target).is('#custom_admin_user_kyc_waiting_list-kycModal')) {
                    $('#custom_admin_user_kyc_waiting_list-kycModal').hide();
                }
            });
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while viewing the KYC image.');
        }
    });

   

    function updateSelectColor(selectElement, status) {
        const colorMap = {
            "verified": "#28B446",  
            "pending": "#FFAD33",   
            "rejected": "red",      
            "waiting": "yellow"      
        };

        selectElement.css({
            "background-color": colorMap[status] || "#f9f9f9",
            "color": (status === "waiting" || status === "pending") ? "black" : "white"
        });
    }

    function user_management_account_status_update_color() {
        $('.user_kyc_waiting_list-kyc-statusselect').each(function () {
            updateSelectColor($(this), $(this).val());
        });
    }
    user_management_account_status_update_color();
} catch (error) {
    console.error('Unexpected Error:', error);
}

// faq page.html
document.addEventListener("DOMContentLoaded", () => {
    const faqItems = document.querySelectorAll('.faq-item');
    const faqTitleMain = document.getElementById('faq-title-main');
    const faqText = document.getElementById('faq-text');

    // Read 'blocked' from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        let isBlocked = urlParams.get("blocked") === "true" ? "true" : sessionStorage.getItem("isBlocked") || "false";
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
        "faq10": "Log in to your account, navigate to the “Payments” section, and add or update your preferred payment methods.",
        "faq11": "Your account may be blocked due to suspicious activity, multiple failed logins, or policy violations. Unauthorized automation or unpaid dues can also restrict access. If this is a mistake, contact gurutech2620@gmail.com for help."
    };
    // Determine the default FAQ based on the blocked status
    let defaultFaq = isBlocked === "true" ? "faq11" : "faq1";
    let defaultFaqItem = document.querySelector(`[data-target="${defaultFaq}"]`);
    // Display the default FAQ
    if (defaultFaqItem) {
        defaultFaqItem.classList.add('expanded');
        defaultFaqItem.querySelector('.icon').textContent = '-';
        faqTitleMain.textContent = defaultFaqItem.querySelector('.faq-title').textContent;
        faqText.textContent = faqContent[defaultFaq];
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
 // Clear sessionStorage when browser is closed
 window.addEventListener("beforeunload", () => {
    sessionStorage.removeItem("isBlocked");
});
});

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById("contact-form");
    const responseMessage = document.getElementById("contact-response-message");
    const orderDetailsBox = document.getElementById("contact-order-details-box");
    const orderDetailsContent = document.getElementById("contact-order-details-content");

    // Auto-fill user name and email
    if (user_name) {
        document.getElementById('contact-name').value = user_name;
    }
    if (user_email) {
        document.getElementById('contact-email').value = user_email;
    }

    if (help_session_id) {
        // Show the order details box
        orderDetailsBox.style.display = 'block';
        
        // Fetch order details
        fetch(`/api/my-orders/?filter=all`)
            .then(response => response.json())
            .then(data => {
                const order = data[help_session_id];
                if (order) {
                    // Build order details HTML
                    let orderDetailsHTML = `
                        <p><strong>Order ID:</strong> ${order.payment_id}</p>
                        <p><strong>Status:</strong> ${order.payment_status}</p>
                        <p><strong>Total Amount:</strong> £${parseFloat(order.total_amount).toFixed(2)}</p>
                        <p><strong>Date:</strong> ${new Date(order.payment_at).toLocaleString()}</p>
                        <h4>Items:</h4>
                        <ul class="contact-order-items-list">`;

                    // Find all winning lotteries and tickets
                    let winningLotteries = [];
                    let winningTickets = [];
                    
                    order.payments.forEach(payment => {
                        orderDetailsHTML += `<li>
                            <strong>${payment.quantity}x ${payment.lottery_event_title}</strong>
                            ${payment.winning_tickets && payment.winning_tickets.length > 0 ? 
                              '<span class="contact-winner-badge">WINNER</span>' : ''}
                            <p>Ticket Numbers: ${payment.ticket_numbers.join(', ')}</p>
                        </li>`;
                        
                        if (payment.winning_tickets && payment.winning_tickets.length > 0) {
                            winningLotteries.push(payment.lottery_event_title);
                            winningTickets = winningTickets.concat(payment.winning_tickets.map(t => `${payment.lottery_event_title}: ${t}`));
                        }
                    });

                    orderDetailsHTML += `</ul>`;
                    
                    // Add winning information if any
                    if (winningLotteries.length > 0) {
                        orderDetailsHTML += `
                            <div class="contact-winning-info">
                                <h4>Winning Information</h4>
                                <p>Congratulations! You won in ${winningLotteries.join(', ')}</p>
                                <p>Winning Tickets: ${winningTickets.join(', ')}</p>
                            </div>`;
                    }

                    orderDetailsContent.innerHTML = orderDetailsHTML;
                    
                    // Clear the session ID after use
                    localStorage.removeItem('help_session_id');
                }
            })
            .catch(error => {
                console.error('Error fetching order details:', error);
            });
    }

    // Handle form submission
    contactForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        try {
            const name = document.getElementById("contact-name").value;
            const email = document.getElementById("contact-email").value;
            let description = document.getElementById("contact-description").value;

            // If order details exist, prepend them to the description
            if (help_session_id && orderDetailsContent.innerHTML) {
                // const orderDetailsText = `\n\n--- ORDER DETAILS ---\n${orderDetailsContent.textContent}`;
                // description += orderDetailsText;
                const orderDetailsText = `\n${orderDetailsContent.textContent}\n\n`;
                description = orderDetailsText + description;
            }
            
            const response = await fetch("/api/contact/", {
                method: "POST",

                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRFToken": contact_csrfToken
                },
                body: JSON.stringify({ 
                    name, 
                    email, 
                    description,
                    order_id: help_session_id || null  // Include order ID if available
                }),
            });

            if (response.ok) {
                const data = await response.json();
                responseMessage.innerText = data.message;
                responseMessage.style.color = "green";
                contactForm.reset();
                // Reset the form and order details
                document.getElementById("contact-description").value = '';
                    // Hide the order details box if it was shown
                orderDetailsBox.style.display = 'none';
                orderDetailsContent.innerHTML = '';
                // Re-fill username and email after reset
                if (user_name) {
                    document.getElementById('contact-name').value = user_name;
                }
                if (user_email) {
                    document.getElementById('contact-email').value = user_email;
                }
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
/*-----------------navbar.html-------*/
function toggleMenu() {
    const navbarLinks = document.querySelector('.navbar-links');
    navbarLinks.classList.toggle('active');

    const hamburger = document.querySelector('.hamburger');
    hamburger.classList.toggle('active');
}
/*----------addimages-----*/
function admin_lottery_add_additional_images () {
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
            const imagePreviews = newImageField.querySelector('.image-preview');
            reader.onload = function (e) {
                const preview = document.createElement('img');
                preview.src = e.target.result;
                preview.className = 'image-preview';
                if(imagePreviews){ // If image already selected replace it with new image for preview
                    imagePreviews.replaceWith(preview);
                }
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
}

//lottery_events_add.html
function lottery_events_add_budget_calculation(){
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
   
        $("#new_lottery_title").on("keyup", function () {
            let new_lottery_title = $(this).val().trim();
            if (new_lottery_title.length > 0) {
                $.ajax({
                    url: "/check_lottery_title_unique/",
                    type: "GET",
                    data: { title: new_lottery_title },
                    success: function (response) {
                        if (response.exists) {
                            $("#lottery_events_add_title_validation").text("This title already exists!").css("color", "red");
                        } else {
                            $("#lottery_events_add_title_validation").text("");
                        }
                    },
                });
            } else {
                $("#lottery_events_add_title_validation").text("");
            }
        });
    
}
//login.html
// Function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

// Setup CSRF token for AJAX requests
$.ajaxSetup({
    headers: { 'X-CSRFToken': csrftoken }
});
$(document).ready(function () {
    // Email validation handler
    $(document).ready(function () {
        // Email validation handler
        $('#login-email').on('focusout', function () {
            const email = $(this).val().trim();
            const errorElement = $('#login-email-error');
            if (!validateEmail(email)) {
                errorElement.text('Invalid email address.').addClass('login-error').removeClass('login-valid');
            } else {
                errorElement.text('').removeClass('login-error').addClass('login-valid'); // Optionally add a valid class
            }
        });
    });
    

    // Password validation handler
    $('#login-password').on('input', function () {
        validatePassword($(this).val(), 'login-password-error');
    });
    togglePasswordVisibility('#login-toggle-password', '#login-password');  
    $.ajaxSetup({
        headers: {
            'X-CSRFToken': getCookie('csrftoken') // Use the getCookie function
        }
    });
    // Function to set a cookie
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
    }

    // Function to delete a cookie
    function deleteCookie(name) {
        document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
    }

    // Populate form fields if cookies exist
    function populateFormFields() {
        const email = getCookie('email');
        const password = getCookie('password');

        if (email && password) {
            $('#login-email').val(email);
            $('#login-password').val(password);
            $('#remember-me-checkbox').prop('checked', true);
        } else {
            $('#remember-me-checkbox').prop('checked', false);
        }
    }

    // Save cookies based on "Remember Me" checkbox
    function saveCookies() {
        const rememberMe = $('#remember-me-checkbox').prop('checked');
        if (rememberMe) {
            const email = $('#login-email').val();
            const password = $('#login-password').val();
            setCookie('email', email, 30);
            setCookie('password', password, 30);
        } else {
            deleteCookie('email');
            deleteCookie('password');
        }
    }

    let timerInterval;

    // Start OTP countdown timer
    function startOtpTimer(duration) {
        const timerDisplay = $('#timer');
        let timeRemaining = duration;

        timerInterval = setInterval(() => {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            timerDisplay.text(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            timeRemaining--;

            if (timeRemaining < 0) {
                clearInterval(timerInterval);
                $('#resend-otp-button').prop('disabled', false); // Enable the "Resend OTP" button
            }
        }, 1000);
    }

    // Show OTP container and start timer
    function showOtpContainer(userId) {
        $('#user-id').val(userId); // Set the user ID
        $('.login-container').addClass('hidden-element'); // Hide login form
        $('#otp-container').removeClass('hidden-element'); // Show OTP section
        $('#resend-otp-button').prop('disabled', true); // Disable "Resend OTP" initially
        startOtpTimer(300); // Start a 5-minute timer
    }

    // Handle OTP cancel button
    $('#otp-cancel-button').on('click', function () {
        $('#otp-container').addClass('hidden-element'); // Hide OTP form
        $('.login-container').removeClass('hidden-element'); // Show login form
        clearInterval(timerInterval); // Stop the timer
    });

    // Handle OTP verification form submission
    $('#otp-form').submit(function (e) {
        e.preventDefault();
        const otpUrl = $(this).data('url'); // Fetch OTP verification URL

        $.ajax({
            type: 'POST',
            url: otpUrl,
            data: JSON.stringify({
                user_id: $('#user-id').val(),
                otp: $('#otp-code').val()
            }),
            contentType: 'application/json',
            success: function (response) {
                alert(response.message); // Display success message
                if (response.redirect_url) {
                    window.location.href = response.redirect_url; // Redirect on success
                }
            },
            error: function () {
                $('#otp-error').text('Invalid or expired OTP.'); // Display error
            }
        });
    });

    // Handle "Resend OTP" button click
    $('#resend-otp-button').on('click', function () {
        const resendOtpUrl = '/api/resend-otp/'; // Replace with actual URL
        const userId = $('#user-id').val();

        $.ajax({
            type: 'POST',
            url: resendOtpUrl,
            data: JSON.stringify({ user_id: userId }),
            contentType: 'application/json',
            success: function () {
                alert('A new OTP has been sent to your email.');
                $('#resend-otp-button').prop('disabled', true); // Disable again
                startOtpTimer(300); // Restart 5-minute timer
            },
            error: function () {
                alert('Failed to resend OTP. Please try again later.');
            }
        });
    });

    // Handle login form submission
    $('#login-form').submit(function (e) {
        e.preventDefault();
        const loginUrl = $(this).data('url'); // Fetch login URL
        saveCookies(); // Save cookies before submitting
        // Clear previous login error message
        $('#login-error').text('');
        $.ajax({
            type: 'POST',
            url: loginUrl,
            data: JSON.stringify({
                email: $('#login-email').val(),
                password: $('#login-password').val()
            }),
            contentType: 'application/json',
            success: function (response) {
                if (response.message === "OTP sent to your email.") {
                    showOtpContainer(response.user_id); // Show OTP section if required
                } else if (response.redirect_url) {
                    window.location.href = response.redirect_url; // Redirect on success
                }
            },
            error: function (xhr) {
                // Handle errors based on the server response
                if (xhr.status === 403 && xhr.responseJSON && xhr.responseJSON.error === "You are blocked.") {
                    // $('#login-error').text('You are blocked.');
                    sessionStorage.setItem("isBlocked", "true"); // Store blocked status
                    $('#login_blocked-modal').show(); 
                } else {
                    sessionStorage.setItem("isBlocked", "false"); // Store unblocked status
                    $('#login-error').text('Invalid email or password.');
                }
            }
        });
    });
       // Block User Modal Close Handling
       $('.login_blocked-close').on('click', function () {
        $('#login_blocked-modal').hide();
    });
    // Close modal when clicking outside
    $(window).on('click', function (event) {
        if ($(event.target).is('#login_blocked-modal')) {
            $('#login_blocked-modal').hide();
        }
    });
    // Initialize functionality
    populateFormFields();
    handleLogout('#logout-button', '/login/');
});
//signup.html for form submitting
togglePasswordVisibility('#signup-toggle-password', '#signup-password');
$('#signup-username').on('focusout', function () {
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
let isEmailValid = false; 
$('#signup-email').on('focusout', function () {
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
                isEmailValid = false; 
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
$(document).ready(function () {
    var passwordInput = $("#signup-password");
    // Show validation message box when clicking the password field
    passwordInput.on("focus", function () {
        $("#password-message").slideDown(200);
    });
    // Hide message box when clicking outside
    $(document).on("click", function (event) {
        if (!$(event.target).closest("#signup-password, #password-message").length) {
            $("#password-message").slideUp(200);
        }
    });
    // Password validation logic
    passwordInput.on("input", function () {
        var password = passwordInput.val();
        // Validate conditions
        validateRequirement(password, /[A-Z]/, "#password-uppercase");  // Uppercase letter
        validateRequirement(password, /[a-z]/, "#password-lowercase");  // Lowercase letter
        validateRequirement((password.match(/\d/g) || []).length >= 4, true, "#password-number");     // Number
        validateRequirement(password, /[\W_]/, "#password-special");    // Special character
        validateRequirement(password.length >= 8, true, "#password-length"); // Length
    });
    // Function to validate and update UI
    function validateRequirement(password, regex, elementId) {
        if (password && (regex instanceof RegExp ? regex.test(password) : password)) {
            $(elementId).removeClass("invalid").addClass("valid").html("✔ " + $(elementId).text().slice(2));
        } else {
            $(elementId).removeClass("valid").addClass("invalid").html("❌ " + $(elementId).text().slice(2));
        }
    }
});
// Clear error message when correcting input
$('#signup-username, #signup-email, #signup-password').on('input', function () {
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



document.addEventListener("DOMContentLoaded", function () {

    // if (typeof kycStatusUrl !== "undefined") {
    //     checkKYCStatus();
        
    // }
    if (typeof kycStatusUrl !== "undefined" && userIsAuthenticated) {
        checkKYCStatus();
    }
    handleKYCForm();
    lottery_events_fetch();
});
if (typeof googleEmail !== "undefined" && googleEmail) {

    // Check if popup was already shown in sessionStorage
    if (sessionStorage.getItem("google_merge_alert_shown") === "true") {

    }

    // ✅ Show the popup
    let popup = document.getElementById("google-popup");
    let popupEmail = document.getElementById("google-user-email");

    if (popup && popupEmail) {
        popupEmail.textContent = googleEmail;
        popup.style.display = "flex"; // Show popup
        popup.style.opacity = "1"; // Fade in effect

        // ✅ Hide the popup after 5 seconds
        setTimeout(() => {
            popup.style.opacity = "0"; // Fade out effect
            setTimeout(() => {
                popup.style.display = "none"; // Hide completely

                // ✅ Clear Google session when the popup disappears
                fetch("/clear-google-session/", {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrftoken, // Ensure CSRF token is properly passed
                        "Content-Type": "application/json",
                    },
                    credentials: "same-origin", // Ensures cookies are sent
                })
                    .catch(() => { }); // Silently handle errors

            }, 500);
        }, 5000);

        // ✅ Store in sessionStorage to prevent showing again in this session
        sessionStorage.setItem("google_merge_alert_shown", "true");
    }
}
//lottery_events.html--user_registrartion module--views.py function class KYCStatusView(APIView): --#ID:LP-I7-start
function checkKYCStatus() {
    if (typeof kycStatusUrl === "undefined") {
        
        return;
    }
    if (!userIsAuthenticated) {  
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
//lottery_events.html--user_registrartion module--views.py function class KYCStatusView(APIView): --#ID:LP-I7-end
//lottery_events.html--user_registrartion module--views.py function class KYCUploadView(APIView): --#ID:LP-I7-start
function handleKYCForm() {
    const kycUploadForm = document.getElementById("kycUploadForm");
    if (kycUploadForm) {
        kycUploadForm.onsubmit = function (e) {
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
    }
}
//lottery_events.html--user_registrartion module--views.py function class KYCUploadView(APIView): --#ID:LP-I7-end


//admin -user_list_details.html
$(document).ready(function () {
    if (typeof userlistUrl !== 'undefined' && userlistUrl) {
        // AJAX call to fetch user data
        $.ajax({
            url: userlistUrl,  // Ensure this URL matches the Django API endpoint
            type: 'GET',
            contentType: 'application/json',
            success: function (response) {
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
            error: function (xhr, status, error) {
                $('#user_list_message').addClass('user_list_error').text("Error fetching user data: " + error).show();
            }
        });
    } else {

    }

    // Modal behavior for viewing the KYC image
    $(document).on('click', '.user_list_view_kyc_image', function (event) {
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
    $('.user_list_close_btn').on('click', function () {
        $('#user_list_kyc_modal').hide(); // Hide the modal when the close button is clicked
    });

    // Close the modal if clicked outside the modal content
    $(window).on('click', function (event) {
        if ($(event.target).is('#user_list_kyc_modal')) {
            $('#user_list_kyc_modal').hide();
        }
    });
});

//admin -user_kyc_waiting_list_details.html

$(document).ready(function () {
    function refreshTable() {
        if (typeof userkycwaitinglistUrl === 'undefined') {
            //console.warn("userkycwaitinglistUrl is not defined.");
            return; // Exit the function if the URL is not defined
        }
        $('#user_kyc_waiting_list-tbody').empty(); // Clear existing table rows

        $.ajax({
            url: userkycwaitinglistUrl,
            type: 'GET',
            contentType: 'application/json',
            success: function (response) {
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
            error: function (xhr, status, error) {
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

    $(document).on('change', '.user_kyc_waiting_list-kyc-status-select', function () {
        const userId = $(this).data('user-id');
        const newStatus = $(this).val();

        $.ajax({
            url: adminupdaetkycapprovalUrl,
            type: 'POST',
            data: JSON.stringify({ user_id: userId, kyc_status: newStatus }),
            contentType: 'application/json',
            headers: { 'X-CSRFToken': csrfToken },
            success: function (response) {
                alert(`KYC status updated to ${newStatus}`);
                refreshTable();
            },
            error: function (xhr, status, error) {
                alert(`Failed to update KYC status: ${error}`);
            }
        });
    });

    $(document).on('click', '.user_kyc_waiting_list-view-kyc-image', function (event) {
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

    $('.user_kyc_waiting_list-close-btn').on('click', function () {
        $('#user_kyc_waiting_list-kycModal').hide();
    });

    $(window).on('click', function (event) {
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

            const email = document.getElementById("reset-email").value.trim();
            const messageDiv = document.getElementById("reset-feedback");
            const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;

            
            const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            if (!emailPattern.test(email)) {
                messageDiv.textContent = 'Invalid email address';
                messageDiv.style.color = "red";
                return; // Stop form submission
            }

            // Clear any previous error
            messageDiv.textContent = "";

            // Proceed with fetch if validation passes
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
                    if (data.message) {
                        // Hide form and show success message
                        document.getElementById("password-reset-form-container").style.display = "none";
                        const emailSentContainer = document.getElementById("email-container");
                        emailSentContainer.style.display = "block";
                        document.getElementById("reset-user-email").textContent = email;
                    } else if (data.email) {
                        messageDiv.textContent = data.email[0]; // Display backend validation error
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

        // Validate password
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
    const uppercasePattern = /[A-Z]/;  // At least one uppercase letter
    const lowercasePattern = /[a-z]/;  // At least one lowercase letter
    const spacePattern = /\s/; // Pattern to detect spaces
    const digitCount = (password.match(numberPattern) || []).length;

    const errorElement = $('#' + errorElementId);

    if (password.length < 8) {
        errorElement.text('');
        return false;
    } else if (spacePattern.test(password)) {
        errorElement.text('Your password must not contain spaces.');
        return false;
    } else if (!uppercasePattern.test(password)) {
        errorElement.text('Your password must contain at least one uppercase letter.');
        return false;
    } else if (!lowercasePattern.test(password)) {
        errorElement.text('Your password must contain at least one lowercase letter.');
        return false;
    }
    else if (!specialCharacterPattern.test(password)) {
        errorElement.text('Your password must contain at least one special character.');
        return false;
    } else if (digitCount < 4) {
        errorElement.text('');
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
    const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const errorElement = $('#' + errorElementId);

    if (!email || email.trim() === '') {
        errorElement.text('Email address is required.');
        return false;
    }
    

    if (!emailPattern.test(email)) {
        errorElement.text('Please enter a valid email address');
        return false;
    }
    errorElement.text('');
    return true;
}

function togglePasswordVisibility(toggleButtonId, passwordFieldId) {
    $(toggleButtonId).on('click', function () {
        const passwordField = $(passwordFieldId);
        // const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
        // passwordField.attr('type', type);
        // // $(this).text(type === 'password' ? '🙈' : '👁️');
        // // Toggle the eye icon between fa-eye and fa-eye-slash
        // $(this).find("i").toggleClass("fa-eye fa-eye-slash");
        
        const icon = $(this).find("img");
        const isPassword = passwordField.attr('type') === 'password';

        // Toggle password visibility
        passwordField.attr('type', isPassword ? 'text' : 'password');

        // Toggle the eye icon between `eye.svg` and `eye-slash.svg`
        const newIconSrc = isPassword ? "/media/images/eye.png" : "/media/images/eye-slash.png";
        icon.attr("src", newIconSrc);
    
    
    });
}


// admin_signup.html
$(document).ready(function () {
    // Password validation message logic
    var adminPasswordInput = $("#admin_signup_password_id");
    var adminPasswordMessage = $("#admin_password_message");

    // Initially hide the password validation box
    adminPasswordMessage.hide();

    // Show validation message box when clicking inside the password field
    adminPasswordInput.on("focus", function () {
        adminPasswordMessage.slideDown(200);
    });

    // Hide message box when clicking outside of the password input and message box
    $(document).on("click", function (event) {
        if (!$(event.target).closest("#admin_signup_password_id, #admin_password_message").length) {
            adminPasswordMessage.slideUp(200);
        }
    });

    // Password validation logic
    adminPasswordInput.on("input", function () {
        var password = adminPasswordInput.val();

        // Validate each requirement dynamically
        adminValidateRequirement(password, /[A-Z]/, "#admin_password_uppercase");  // Uppercase letter
        adminValidateRequirement(password, /[a-z]/, "#admin_password_lowercase");  // Lowercase letter
        adminValidateRequirement((password.match(/\d/g) || []).length >= 4, true, "#admin_password_number");    // Number
        adminValidateRequirement(password, /[\W_]/, "#admin_password_special");    // Special character
        adminValidateRequirement(password.length >= 8, true, "#admin_password_length"); // Minimum length
    });

    // Function to validate and update UI for password requirements
    function adminValidateRequirement(password, regex, elementId) {
        if (password && (regex instanceof RegExp ? regex.test(password) : password)) {
            $(elementId).removeClass("invalid").addClass("valid").html("✔ " + $(elementId).text().slice(2));
        } else {
            $(elementId).removeClass("valid").addClass("invalid").html("❌ " + $(elementId).text().slice(2));
        }
    }
});
$(document).ready(function () {
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

    $('#admin_signup_username_id').on('blur', function () {
        const admin_username = $(this).val();
        if (!validateUsername(admin_username)) return;

        $.ajax({
            type: 'POST',
            url: adminapiAdminSignupUrl, // Replace with your actual API endpoint
            data: JSON.stringify({ 'admin_username': admin_username }),
            contentType: 'application/json',
            success: function (response) {
                $('#admin_signup_username_error').text('');
            },
            error: function (response) {
                const error = response.responseJSON.admin_username;
                $('#admin_signup_username_error').text(error ? error[0] : '');
            }
        });
    });

    $('#admin_signup_email_id').on('input', function () {
        const admin_email = $(this).val();
        if (!validateEmail(admin_email)) return;

        $.ajax({
            type: 'POST',
            url: adminapiAdminSignupUrl, // Replace with your actual API endpoint
            data: JSON.stringify({ 'admin_email': admin_email }),
            contentType: 'application/json',
            success: function (response) {
                $('#admin_signup_email_error').text('');
            },
            error: function (response) {
                const error = response.responseJSON.admin_email;
                $('#admin_signup_email_error').text(error ? error[0] : '');
            }
        });
    });



    $('#admin_signup_username_id').on('focusout', function () {
        validateUsername($(this).val(), 'admin_signup_username_error');
    });

    $('#admin_signup_email_id').on('focusout', function () {
        validateEmail($(this).val(), 'admin_signup_email_error');
    });

    $('#admin_signup_password_id').on('input', function () {
        validatePassword($(this).val(), 'admin_signup_password_error');
    });



    togglePasswordVisibility('#admin_signup_toggle_password', '#admin_signup_password_id');
    //    admin_signup.html (adminpanel template)
    //    User,adminprofile table (models.py)
    //    api_admin_signup function (views.py)
    $('#admin_signup_form').submit(function (e) {
        e.preventDefault();
        const username = $('#admin_signup_username_id').val();
        const email = $('#admin_signup_email_id').val();
        const password = $('#admin_signup_password_id').val();

        if (validateUsername(username, 'admin_signup_username_error') && validateEmail(email, 'admin_signup_email_error') && validatePassword(password, 'admin_signup_password_error')) {
            $.ajax({
                type: 'POST',
                url: adminapiAdminSignupUrl, // Replace with your actual API endpoint
                data: JSON.stringify({ admin_username: username, admin_email: email, admin_password: password }),
                contentType: 'application/json',
                success: function (response) {
                    window.location.href = adminapiAdminloginupUrl; // Replace with your actual login URL
                },
                error: function (response) {
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
$(document).ready(function () {
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


    $(document).ready(function () {
        $('#custom_admin_login_email_id').on('focusout', function () {
            validateEmail($(this).val(), 'custom_admin_login_email_error');
            $('#custom_admin_login_errorMessage').text('');
        });
        

         //    custom_admin_login.html (adminpanel template)
        //    user,adminprofile table (models.py)
        //    api_admin_login function (views.py)
        $('#custom_admin_login_form').submit(function (e) {
            e.preventDefault();
            const admin_email = $('#custom_admin_login_email_id').val();
            const admin_password = $('#custom_admin_login_password_id').val();
            if (validateEmail(admin_email, 'custom_admin_login_email_error') ) {


                $.ajax({
                    type: 'POST',
                    url: api_admin_login_url,
                    data: JSON.stringify({ admin_email, admin_password }),
                    contentType: 'application/json',
                    success: function (response) {
                        if (response.success) {
                            $('#custom_admin_login_errorMessage').text('');
                            window.location.href = custom_admin_dashboard_url;
                        } else {
                            $('#custom_admin_login_errorMessage').text(response.message);
                        }
                    },
                    error: function (xhr) {
                        const response = xhr.responseJSON;
                        $('#custom_admin_login_errorMessage').text(response && response.message ? response.message : 'Invalid email or password.');
                    }
                });
            }
        });
        // Remember Me Functionality
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
    }

    function deleteCookie(name) {
        document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
    }

    function populateFormFields() {
        const email = getCookie('admin_email');
        const password = getCookie('admin_password');

        if (email && password) {
            $('#custom_admin_login_email_id').val(email);
            $('#custom_admin_login_password_id').val(password);
            $('#remember-me-checkbox-admin').prop('checked', true);
        } else {
            $('#remember-me-checkbox-admin').prop('checked', false);
        }
    }

    function saveCookies() {
        const rememberMe = $('#remember-me-checkbox-admin').prop('checked');
        if (rememberMe) {
            const email = $('#custom_admin_login_email_id').val();
            const password = $('#custom_admin_login_password_id').val();
            setCookie('admin_email', email, 30);
            setCookie('admin_password', password, 30);
        } else {
            deleteCookie('admin_email');
            deleteCookie('admin_password');
        }
    }

    // Populate form fields on page load
    populateFormFields();

    // Save credentials when form is submitted
    $('#custom_admin_login_form').submit(function() {
        saveCookies();
    });
});
});


//lottery_events_add.html

function filterCategories() {
    fetchCategories();
}
function fetchCategories() {
    fetch(get_lottery_categories_url)  // Replace with the correct endpoint
        .then(response => response.json())
        .then(data => {
            const categoryDropdown = document.getElementById('category-filter');
            data.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryDropdown.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching categories:', error));
}

// Fetch and render lottery events
let currentPage = 1;
let currentSearchTerm = '';
let currentCategoryId = '';
let lottery_Cards = 3; // Set Lottery cards as default
let lotteryPerPage = lottery_Cards; // Set the number of lotteries per page

$(document).ready(function () {
    // Use event delegation to handle dynamically added input fields
    $(document).on("keyup", ".lottery_events_add_edit_title", function () {
        let inputField = $(this);
        let title = inputField.val().trim().toLowerCase();
        let originalTitle = (inputField.data("original-value") || "").toString().toLowerCase();
        let errorMessage = inputField.siblings(".lottery_edit_title_error");

        if (title.length > 0) {
            $.ajax({
                url: "/check_lottery_title_unique/",
                type: "GET",
                data: { title: title },
                success: function (response) {
                    if (response.exists && title !== originalTitle) {
                        errorMessage.text("This title already exists!").css("color", "red").show();
                    } else {
                        errorMessage.text("").hide();
                    }
                },
            });
        } else {
            errorMessage.text("Title is required").css("color", "red").show();
        }
    });
});
function lottery_draw_date_input_formatDateForInput(dateString) {
    if (!dateString) return ''; // Return empty string for null/undefined dates
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Return empty string for invalid dates
    
    return date.toISOString().slice(0, 16);
}

 //    custom_admin_dashboard.html (adminpanel template)
//    LotteryEvent table (models.py)
//    api_get_lottery_events_admin function (views.py)
function fetchLotteryEvents(searchTerm = null, categoryId = null, page = 1) {
    currentPage = page;

    // Reset search and category when clearing filters
    currentSearchTerm = searchTerm !== null ? searchTerm : currentSearchTerm;
    currentCategoryId = categoryId !== null ? categoryId : currentCategoryId;

    // Ensure "All Categories" or cleared search fetches all lotteries
    if (currentSearchTerm === '') currentSearchTerm = '';
    if (currentCategoryId === '') currentCategoryId = '';

    const encodedSearchTerm = encodeURIComponent(currentSearchTerm);
    const apiUrl = `${api_get_lottery_events_url_admin}?search=${encodedSearchTerm}&category=${currentCategoryId}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('lottery-events-container');
            container.innerHTML = ''; // Clear existing events
            if (!data || data.length === 0) {
                container.textContent = 'Lottery not found '; 
            }
            

            const totalItems = data.length;
            const totalPages = Math.ceil(totalItems / lotteryPerPage);
            const paginatedData = data.slice((page - 1) * lotteryPerPage, page * lotteryPerPage);

            paginatedData.forEach(event => {
                const eventDiv = document.createElement('div');
                eventDiv.classList.add('lottery-event-card');
                eventDiv.dataset.id = event.id;

               // Handle additional images
               let additionalImagesHtml = '';
               if (event.additional_images && event.additional_images.length > 0) {
                   additionalImagesHtml = `
                       <div class="additional-images">
                           <h4>Additional Images:</h4>
                           <div class="additional-images-scroll-container">
                               ${event.additional_images.map((image, index) => `
                                   <div class="additional-image-item" data-image-id="${image.id}">
                                       <img src="${image.image}" alt="Additional Image" class="lottery-events-additional-image"/>
                                       <button class="remove-image-btn" onclick="removeAdditionalImage(${image.id}, ${event.id})">Remove</button>
                                   </div>
                               `).join('')}
                           </div>
                       </div>
                       <div class="add-additionalimages-container">
                       </div>
                   `;
               }


               eventDiv.innerHTML = `
           <h3>
               <span class="lottery_events_add_title">${event.title}</span>
               <input type="text" class="lottery_events_add_edit_title" value="${event.title}" data-original-value="${event.title}" required>
               <div class="lottery_events_add_error_message lottery_edit_title_error"></div>
           </h3>

           <p>
               Description:<span class="lottery_events_add_description">${event.description}</span>
               <textarea class="lottery_events_add_edit_description" data-original-value="${event.description}" required>${event.description}</textarea>
               <div class="lottery_events_add_error_message lottery_edit_description_error">Description is required</div>
           </p>
           <p style="display: none;">
               Price: <span class="lottery_events_add_price">£${event.price}</span>
               <input type="number" class="lottery_events_add_edit_price" value="${event.price}" data-original-value="${event.price}" value="0">
               <div class="lottery_events_add_error_message lottery_edit_price_error">Price is required</div>
           </p>
           <p>
               Draw Date: <span class="lottery_events_add_draw_date">${event.draw_date}</span>
<input type="datetime-local" class="lottery_events_add_edit_draw_date" 
    value="${lottery_draw_date_input_formatDateForInput(event.draw_date)}" 
    data-original-value="${lottery_draw_date_input_formatDateForInput(event.draw_date)}" 
    min="${new Date().toISOString().slice(0, 16)}"
    required onkeydown="return false;">
                   <div class="lottery_events_add_error_message lottery_edit_draw_date_error">Draw Date is required</div>
           </p>
          <p id="category_Details">Category: <strong class="category_Name" >${event.category.name}</strong>
           <span class="lottery_events_set_category" hidden>${event.category.name}</span>
           </p>

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
        <p style="display: none;">
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

            updatePagination(totalPages);
        })
        .catch(error => console.error('Error fetching events:', error));
}

function updatePagination(totalPages) {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return; // Hide pagination if only one page

    let paginationHTML = `<ul class="custom_admin_dashboard_fetchLotteryEvents_pagination">`;

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<li class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_item"><a class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_link" href="#" onclick="fetchLotteryEvents('${currentSearchTerm}', '${currentCategoryId}', ${currentPage - 1})">Previous</a></li>`;
    }

    let beforePage = currentPage - 1;
    let afterPage = currentPage + 1;

    // Show first page and dots if needed
    if (currentPage > 2) {
        paginationHTML += `<li class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_item"><a class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_link" href="#" onclick="fetchLotteryEvents('${currentSearchTerm}', '${currentCategoryId}', 1)">1</a></li>`;
        if (currentPage > 3) {
            paginationHTML += `<li class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_item custom_admin_dashboard_fetchLotteryEvents_pagination_dots">...</li>`;
        }
    }

    // Display current, before, and after page numbers
    for (let i = beforePage; i <= afterPage; i++) {
        if (i > 0 && i <= totalPages) {
            let activeClass = i === currentPage ? 'active' : '';
            paginationHTML += `<li class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_item ${activeClass}"><a class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_link" href="#" onclick="fetchLotteryEvents('${currentSearchTerm}', '${currentCategoryId}', ${i})">${i}</a></li>`;
        }
    }

    // Show last page and custom_admin_dashboard_fetchLotteryEvents_pagination_dots if needed
    if (currentPage < totalPages - 1) {
        if (currentPage < totalPages - 2) {
            paginationHTML += `<li class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_item custom_admin_dashboard_fetchLotteryEvents_pagination_dots">...</li>`;
        }
        paginationHTML += `<li class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_item"><a class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_link" href="#" onclick="fetchLotteryEvents('${currentSearchTerm}', '${currentCategoryId}', ${totalPages})">${totalPages}</a></li>`;
    }

    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<li class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_item"><a class="custom_admin_dashboard_fetchLotteryEvents_pagination_page_link" href="#" onclick="fetchLotteryEvents('${currentSearchTerm}', '${currentCategoryId}', ${currentPage + 1})">Next</a></li>`;
    }

    paginationHTML += `</ul>`;
    paginationContainer.innerHTML = paginationHTML;
}

// Function to handle category selection
function handleCategoryChange(categoryId) {
    if (categoryId === 'all') {
        fetchLotteryEvents('', '', 1); // Reset to show all lotteries
    } else {
        fetchLotteryEvents('', categoryId, 1);
    }
}

// Function to handle search input
function handleSearchInput(searchText) {
    if (searchText.trim() === '') {
        fetchLotteryEvents('', currentCategoryId, 1); // Reset search
    } else {
        fetchLotteryEvents(searchText, currentCategoryId, 1);
    }
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
    const totalTickets = perTicketPrice > 0 ? Math.ceil(totalAmount / perTicketPrice) : 0;

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
    const categoryField = card.querySelector('.category_Name'); 
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
  
      // Additional Images button Container
      const additionalImagesContainer = card.querySelector('.add-additionalimages-container');
      if(additionalImagesContainer){
          //additionalImagesContainer.style.display = 'block';
          additionalImagesContainer.style.visibility = "visible";
  
      additionalImagesContainer.replaceChildren();// clear all child elements
      }
      
      
      let firstClick = false;// check whether button clicked
      let clickedCount = 0; // get count of clicks
  
      // Add functionality to dynamically add a new image field
      // Add functionality to dynamically add a new image field
    addImageButton.addEventListener('click', function() {
        const additional_Images_Container = card.querySelector('.additional-images-container');
        let AddImagecount = $(".add-additionalimages-container").children().length; // Count child elements  
        clickedCount++;
        //Create Additional Image Fileds If not available inside Container
        const CreateAdditionalImageContainer = () =>{
            let additionalImagesHtml = `
            <!-- Additional Images Section -->
            <div class="additional-images-container">
                        <div class="additional-images">
                             <!--<h4>Additional Images:</h4> Heading outside the scrollable container -->
                            <div class="additional-images-scroll-container">  
                            </div>
                        </div>
                        <div class="add-additionalimages-container" style="visibility: visible;"></div>
                    </div>`;
            additional_Images_Container.innerHTML=additionalImagesHtml;
        } 
        //Add Additional Images
        const AddImageFields = () => {
            firstClick = true;
            //Creating New Additional Images
            const createElements=()=>
                {
                    const newImageField = document.createElement('div');
                    newImageField.className = 'additional-image-item';
                    newImageField.innerHTML = `
                        <input type="file" name="additional_images[]" accept="image/*">
                        <button type="button" class="remove-image-button">Remove</button>
                    `;
        
                    // Add additional Image Container
                   if(additionalImagesContainer){
                        additionalImagesContainer.append(newImageField);
                    }
                    else {
                        card.querySelector('.add-additionalimages-container').append(newImageField);
                        console.log('Updated to new Container ');
                    }
        
                    // Attach remove functionality to the new image remove button
                    newImageField.querySelector('.remove-image-button').addEventListener('click', function() {
                        newImageField.remove();
                    });
                }

            // check If Additional images available in cards
        if ($(this).parent().find('.additional-images-scroll-container').length > 0) {
             createElements();
         } else {
             CreateAdditionalImageContainer();
             createElements();
             $('.additional-images-container .additional-images h4').css('display','none');
             console.log('Image fields created');
         }
         
            
        }
        // Remove unnecessary DOM elements 
        if (AddImagecount > clickedCount) {
            let removeChild= AddImagecount-clickedCount;
            $(".add-additionalimages-container").children().slice(`-${removeChild}`).remove(); // Select last and remove 
        }
        else { // Creating add image fields
            if(AddImagecount>0 && !firstClick){
                $(".add-additionalimages-container").children().remove();
            }
            console.log('removed extra fields successfully');

            // check if both condition are equal remove last elements
            if(AddImagecount===clickedCount){
                $(".add-additionalimages-container").children(':last').remove();
            }
            AddImageFields();
        }
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

    const miniLimit = card.querySelector('.lottery_events_add_edit_minilimit');
    const maxLimit = card.querySelector('.lottery_events_add_edit_maxlimit');

    fixedRevenueInput.value = fixedRevenueInput.getAttribute('data-original-value');
    percentageRevenueInput.value = percentageRevenueInput.getAttribute('data-original-value');

    miniLimit.value = miniLimit.getAttribute('data-original-value');
    maxLimit.value = maxLimit.getAttribute('data-original-value');
}


// Cancel edit mode and revert to initial state
function lottery_events_cancelEdit(button) {
    const card = button.closest('.lottery-event-card');
    lottery_events_edit_resetFields(card); // Reset fields to original values
    lottery_events_edit_clearErrorMessages(card); // Clear error messages when canceling

    // Hide the select dropdown and show the static text
    const revenueTypeSelect = card.querySelector('.lottery_events_add_edit_revenue_type');
    const revenueTypeSpan = card.querySelector('.lottery_events_add_revenue_type');
    const originalRevenueType = revenueTypeSelect.getAttribute('data-original-value');
    revenueTypeSelect.style.display = 'none';
    revenueTypeSelect.value = originalRevenueType;
    revenueTypeSpan.style.display = 'block';

     // Reset Category Field 
     const categorySelect = card.querySelector('.lottery_events_add_edit_category');
     const category_Name = card.querySelector('.lottery_events_set_category'); // Replace category element
     const category_Details= card.querySelector('#category_Details');
     category_Details.innerHTML=`Category: <strong class="category_Name" >${category_Name.textContent}</strong>
     <span class="lottery_events_set_category" hidden>${category_Name.textContent}</span>`; 
     categorySelect.replaceWith(category_Details);
     card.classList.remove('lottery_events_add_edit_mode'); // Exit edit mode
    // Hide the "Add Another Image" button
    const addImageButton = card.querySelector('.add-image-button');
    if (addImageButton) {
        addImageButton.style.display = 'none';
    }

     // Hide the Add additional image container

     const add_Additionalimages_Container =  card.querySelector('.add-additionalimages-container');
     //const additionalimage_Item =  add_Additionalimages_Container.querySelectorAll('.additional-image-item');
     if (add_Additionalimages_Container) {
         //add_Additionalimages_Container.style.display = 'none';
         add_Additionalimages_Container.style.visibility='hidden';
         //additionalimage_Item.innerHTML='';
         add_Additionalimages_Container.querySelectorAll('.additional-image-item').forEach(function(element) {
             element.remove();
         });
         card.querySelector('.add-additionalimages-container').innerHTML=''; // clear all additional image fields
         $(".add-additionalimages-container").children().remove();
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
        var title_error_value = card.querySelector('.lottery_edit_title_error').textContent;
        if (title_error_value.toLowerCase() === "this title already exists!" || title_error_value.trim() !== "") {
            card.querySelector('.lottery_edit_title_error').style.display = 'block';
            isValid = false;
            card.querySelector('.lottery_edit_title_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else{
            card.querySelector('.lottery_edit_title_error').style.display = 'none';
        }
    }
   
   

    if (!description) {
        card.querySelector('.lottery_edit_description_error').style.display = 'block';
        isValid = false;
        card.querySelector('.lottery_edit_description_error').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        card.querySelector('.lottery_edit_description_error').style.display = 'none';
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
//    custom_admin_dashboard.html (adminpanel template)
//    LotteryEvent table (models.py)
//    api_edit_delete_lottery_events function (views.py)
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
    //const slug = card.querySelector('.lottery_events_add_edit_slug').value;
    const miniLimit = card.querySelector('.lottery_events_add_edit_minilimit').value;
    const maxLimit = card.querySelector('.lottery_events_add_edit_maxlimit').value;
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
    formData.append('competition_details', competitionDetails);
    // Append additional images to the formData
    additionalImageFiles.forEach((imageFile, index) => {
        formData.append('additional_images[]', imageFile);
    });
    const url = apiEditDeleteLotteryEventsUrl.replace('0', id);

    fetch(url, {
        method: 'PUT',
        headers: {
            'X-CSRFToken': lottery_events_add_csrftoken,
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

               
                // Update additional images
                const additionalImagesContainer = card.querySelector('.additional-images-container');
                if (data.additional_images && data.additional_images.length > 0) {
                    let additionalImagesHtml = `
                        <div class="additional-images">
                            <h4>Additional Images:</h4> <!-- Heading outside the scrollable container -->
                            <div class="additional-images-scroll-container">
                                ${data.additional_images.map((image, index) => `
                                    <div class="additional-image-item" data-image-id="${image.id}">
                                        <img src="${image.image}" alt="Additional Image" class="lottery-events-additional-image"/>
                                        <button class="remove-image-btn" onclick="removeAdditionalImage(${image.id}, ${data.id})">Remove</button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="add-additionalimages-container">
                        </div>
                    `;
                    additionalImagesContainer.innerHTML = additionalImagesHtml;
                } else {
                    additionalImagesContainer.innerHTML = '';
                }

                revenueTypeSpan.textContent = revenueTypeSelect.value;
                revenueTypeSelect.style.display = 'none';
                revenueTypeSpan.style.display = 'block';
                 // Reset Category Field
                 const selectedText = categorySelect.options[categorySelect.selectedIndex].text;
                 const category_Details = card.querySelector('#category_Details');
                 category_Details.innerHTML = `Category: <strong class="category_Name" >${selectedText}</strong>
                 <span class="lottery_events_set_category" hidden>${selectedText}</span>`;
                 categorySelect.replaceWith(category_Details);
                 // Hide add image buttons
                const addImageButton = card.querySelector('.add-image-button');
                if (addImageButton) {
                    addImageButton.style.display = 'none';
                } 
               // Hide the Add additional image container
                const add_Additionalimages_Container =  card.querySelector('.add-additionalimages-container');
                if (add_Additionalimages_Container) {
                    //add_Additionalimages_Container.style.display = 'none';
                    add_Additionalimages_Container.style.visibility='hidden';
                    //additionalimage_Item.innerHTML='';
                    add_Additionalimages_Container.querySelectorAll('.additional-image-item').forEach(function(element) {
                        element.remove();
                    });
                    card.querySelector('.add-additionalimages-container').innerHTML=''; // clear all additional image fields
                $(".add-additionalimages-container").children().remove();
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
//    custom_admin_dashboard.html (adminpanel template)
//    LotteryEvent table (models.py)
//    api_edit_delete_lottery_events function (views.py)
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

//    custom_admin_dashboard.html (adminpanel template)
//    LotteryEvent table (models.py)
//    api_lottery_events_add function (views.py)
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
    // Validate Title already exists!
        if (title.length > 0) {
            $.ajax({
                url: "/check_lottery_title_unique/",
                type: "GET",
                data: { title : title },
                success: function (response) {
                    if (response.exists) {
                        showValidationError('lottery_events_add_title_validation', 'This title already exists!.');
                    } else {
                        clearValidationError('lottery_events_add_title_validation');
                        $("#lottery_events_add_title_validation").text("");
                    }
                },
            });
        } else {
            showValidationError('lottery_events_add_title_validation', 'Title is required.');
            
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
    document.getElementById('lottery_events_add_competitiondetails_validation').textContent = '';
}



// Function to show validation errors near each field
function validate_lottery_events_add_inputs(errors) {
    if (errors.title) document.getElementById('lottery_events_add_title_validation').textContent = errors.title.join(', ');
    if (errors.description) document.getElementById('lottery_events_add_description_validation').textContent = errors.description.join(', ');
    if (errors.price) document.getElementById('lottery_events_add_price_validation').textContent = errors.price.join(', ');
    if (errors.draw_date) document.getElementById('lottery_events_add_drawdate_validation').textContent = errors.draw_date.join(', ');
    if (errors.image) document.getElementById('lottery_events_add_image_validation').textContent = errors.image.join(', ');
    if (errors.is_active) document.getElementById('lottery_events_add_isactive_validation').textContent = errors.is_active.join(', ');
    // if (errors.slug) document.getElementById('lottery_events_add_slug_validation').textContent = errors.slug.join(', ');
    if (errors.min_limit) document.getElementById('lottery_events_add_minilimit_validation').textContent = errors.min_limit.join(', ');
    if (errors.max_limit) document.getElementById('lottery_events_add_maxlimit_validation').textContent = errors.max_limit.join(', ');
    if (errors.competition_details) document.getElementById('lottery_events_add_competitiondetails_validation').textContent = errors.competition_details.join(', ');
}


//lottery_events.html--adminpanel module--views.py function class api_get_lottery_events(APIView):  -- --#ID:LP-I7-start
function lottery_events_fetch() {
    try {

        if (typeof api_get_lottery_events_url === 'undefined' || !api_get_lottery_events_url) {

            return; 
        }

        fetch(api_get_lottery_events_url)
            .then(response => response.json())
            .then(data => {
                displayLotteryEvents(data);
                checkKYCStatus();
                handleKYCForm();
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}


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
//lottery_events.html--adminpanel module--views.py function class api_get_lottery_events(APIView):  -- --#ID:LP-I7-end
//favorites.html--adminpanel module--views.py function def get_favorites --#ID:LP-I17-start
function updateFavoritesCount() {
    fetch('/api/get_favorites/')
        .then(response => response.json())
        .then(data => {

            const favoritesCount = data.favorites.length;
            document.getElementById('favorites-count').innerText = favoritesCount;
        })
        .catch(error => console.error('Error fetching favorites count:', error));
}
//favorites.html--adminpanel module--views.py function def get_favorites --#ID:LP-I17-end
//cart.html--adminpanel module--views.py function def get_cart(request): --#ID:LP-I63-start
function updateCartCount() {
    fetch('/api/get-cart/') 
        .then(response => response.json())
        .then(data => {
            const cartCount = Object.keys(data).length; 
            document.getElementById('cart-item-count').innerText = cartCount; 
        })
        .catch(error => console.error('Error fetching cart count:', error));
}
//cart.html--adminpanel module--views.py function def get_cart(request): --#ID:LP-I63-end
//cart.html--adminpanel module--views.py function def get_cart(request): --#ID:LP-I63-start
function updateCartCount_cartpage() {
    fetch('/api/get-cart/') 
        .then(response => response.json())
        .then(data => {
            const cartCount = Object.keys(data).length; 
            document.getElementById('cart-item-count-cartpage').innerText = cartCount;
        })
        .catch(error => console.error('Error fetching cart count:', error));
}
//cart.html--adminpanel module--views.py function def get_cart(request): --#ID:LP-I63-end
function header_navbar_fetchCategories() {
    if (typeof api_get_categories_url === "undefined") {
        return;
    }

    fetch(api_get_categories_url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error("Invalid data format: Expected an array.");
            }
            header_navbar_displayCategories(data);
            adjustDropdownPosition();
        })
        .catch(error => {
            console.error("Error fetching categories:", error);
            displayFetchError();
        });
}

function header_navbar_displayCategories(categories) {
    const dropdownMenu = document.getElementById("categories_dropdown_competitions");
    if (!dropdownMenu) return;

    dropdownMenu.innerHTML = "";

    if (categories.length === 0) {
        dropdownMenu.innerHTML = '<div class="dropdown-item_competitions">No categories available</div>';
        return;
    }

    categories.forEach(category => {
        const categoryLink = document.createElement("a");
        categoryLink.href = `/category_lottery_events/${encodeURIComponent(category.name)}/`;
        categoryLink.classList.add("dropdown-item_competitions");
        categoryLink.textContent = category.name;
        dropdownMenu.appendChild(categoryLink);
    });
}

function adjustDropdownPosition() {
    const dropdown = document.getElementById("categories_dropdown_competitions");
    if (!dropdown) return;
    
    dropdown.style.left = "0";
    dropdown.style.transform = "none";
    dropdown.style.width = "auto";
}


function displayFetchError() {
    const dropdownMenu = document.getElementById("categories_dropdown_competitions");
    if (!dropdownMenu) return;
    
    dropdownMenu.innerHTML = '<div class="dropdown-item_competitions" style="color:red;">Error loading categories</div>';
}


document.addEventListener("DOMContentLoaded", header_navbar_fetchCategories);
window.addEventListener("resize", adjustDropdownPosition);

function setupDropdown(dropdownBtnSelector, dropdownContentSelector) {
    const dropdownBtn = document.querySelector(dropdownBtnSelector);
    const dropdownContent = document.querySelector(dropdownContentSelector);

    if (!dropdownBtn || !dropdownContent) {

        return;
    }

    dropdownBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        dropdownContent.classList.toggle("show-dropdown");
    });

    
    document.addEventListener("click", function (event) {
        if (!dropdownBtn.contains(event.target) && !dropdownContent.contains(event.target)) {
            dropdownContent.classList.remove("show-dropdown");
        }
    });
}


setupDropdown(".dropbtn_competitions", ".dropdown-content_competitions");


function scrollToFirstCategory() {
    const firstCategory = document.querySelector('.category_section'); 
    const categoriesTabs = document.querySelector('.categories-tabs');
    const adjustheight = 20;
    if (firstCategory) {
        
        window.scrollTo({
            top: firstCategory.offsetTop - categoriesTabs.offsetHeight - adjustheight,
            behavior: 'smooth'
        });
        console.log('Scrolling to position:', firstCategory.offsetTop - categoriesTabs.offsetHeight - adjustheight);
    }
}

function populateCategoryTabs(categories) {
    const tabsContainer = document.getElementById('categories_tabs');
    tabsContainer.innerHTML = '';

    categories.forEach((category, index) => {
        const tab = document.createElement('button');
        tab.classList.add('category-tab');
        tab.textContent = category.name;
        tab.dataset.categoryId = category.id; 
        if (index === 0) tab.classList.add('active');
        const indicator = document.createElement('div');
        indicator.classList.add('tab-indicator');
        tab.appendChild(indicator);
        tab.onclick = function () {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const categorySection = document.getElementById(`category_${category.id}`);
            if (categorySection) categorySection.scrollIntoView({ behavior: 'smooth' });
        };
        tabsContainer.appendChild(tab);
    });
     
    addRightScrollArrow();
}
/*Right arrow for scroll the category in mobile view */
function addRightScrollArrow() {
    let rightArrow = document.getElementById('scroll-right-arrow');
    const tabsContainer = document.getElementById('categories_tabs');
    const wrapper = tabsContainer.parentElement;

    if (!rightArrow) {
        rightArrow = document.createElement('button');
        rightArrow.id = 'scroll-right-arrow';
        rightArrow.innerHTML = '➜';
        rightArrow.classList.add('scroll-arrow');
        wrapper.appendChild(rightArrow);
    }

    
    rightArrow.style.fontSize = 'x-large';
    rightArrow.style.fontWeight = 'bold';
    rightArrow.style.zIndex = '2000';

    rightArrow.onclick = function () {
        tabsContainer.scrollBy({ left: 100, behavior: 'smooth' });
    };

    function updateArrowVisibility() {
        const isOverflowing = tabsContainer.scrollWidth > tabsContainer.clientWidth;
        const isScrolledToEnd = tabsContainer.scrollLeft >= (tabsContainer.scrollWidth - tabsContainer.clientWidth - 1);
        
        
        rightArrow.style.display = (isOverflowing && !isScrolledToEnd) ? 'block' : 'none';
    }

    tabsContainer.addEventListener('scroll', updateArrowVisibility);
    window.addEventListener('resize', updateArrowVisibility);
    updateArrowVisibility();
}

function setupScrollHandler() {
    const navbar = document.querySelector('header');
    const navbarHeight = navbar ? navbar.offsetHeight : 0;
    const sections = document.querySelectorAll('.category_section');

    const observerOptions = {
        root: null,
        rootMargin: `-${navbarHeight}px 0px 0px 0px`,
        threshold: 0.5 
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const categoryId = entry.target.id.split('_')[1];
                document.querySelectorAll('.category-tab').forEach(tab => {
                    const isActive = tab.dataset.categoryId === categoryId;
                    tab.classList.toggle('active', isActive);
                    tab.querySelector('.tab-indicator').style.display = isActive ? 'block' : 'none';
                    //Mobile view: MenuBar Slides Right to Left
                        if ((window.matchMedia("(max-width: 768px)").matches)){ 
                        const categories_tabs = document.getElementById('categories_tabs');
                        categoryId >3 ? categories_tabs.scrollBy({ left: 300, behavior: 'smooth' }) :
                        categories_tabs.scrollBy({ left: -300, behavior: 'smooth' });
                        }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}


function displayLotteryEvents(events) {
    const container = document.getElementById('lottery_events_container');
    container.innerHTML = ''; 
    if (events.length === 0) {
        container.innerHTML = '<p>No lottery events available.</p>';
        return;
    }

    events = events.filter(event => event.is_active);

    const categoriesMap = {};

    events.forEach(event => {
        if (event.category && event.category.id) {
            const categoryId = event.category.id;
            const categoryName = event.category.name || 'Unknown Category';
            const categoryLogo = event.category.category_logo || ''; 
            if (!categoriesMap[categoryId]) {
                categoriesMap[categoryId] = { id: categoryId, name: categoryName, logo: categoryLogo };
            }
        }
    });


    const categories = Object.values(categoriesMap).sort((a, b) => a.id - b.id);


    populateCategoryTabs(categories);

    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.id = `category_${category.id}`;
        categoryElement.classList.add('category_section');
        categoryElement.innerHTML = `
        <div class="category_header">
           ${category.logo ? `<img src="${category.logo}" alt="${category.name} Logo" class="category_icon">` : ''}
            <h2>${category.name}</h2>
        </div>`;

        const viewAllButton = document.createElement('button');
        viewAllButton.classList.add('view_all_button');
        
        viewAllButton.innerHTML = `
View all 
<img src="/media/lottery_images/arrow (1).png" alt="Arrow Icon1">
`;

        viewAllButton.onclick = function () {
            window.location.href = `/category_lottery_events/${category.name}/`;
        };
        categoryElement.appendChild(viewAllButton);

        const categoryEventsContainer = document.createElement('div');
        categoryEventsContainer.classList.add('lottery_events_displayed_container');

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
            const enterNowButton = `
            <a href="/lottery_detail/${event.slug}/" class="lottery_events_enter_button">
            ${category.logo ? `<img src="${category.logo}" alt="${category.name} Logo" class="lottery_events_enter_enter_icon">` : ''}
          Enter Now
        <img src="/media/lottery_images/arrow (2).png" alt="Arrow Icon">
    </a>`;


            eventElement.innerHTML = `
                ${favoriteIcon}
                <div class="lottery_events_event_header">${drawDateString}</div>
                ${event.image ? `<img src="${event.image}" alt="${event.title}" class="similar_category_lottery_event_img" />` : ''}
                <div style="color: #FF6600; font-size: 14px; font-family: Rajdhani; font-weight: 600; word-wrap: break-word">Automated Draw</div>
                   <h3 class="lottery_title">${event.title}</h3>
               <p class="lt-p">${event.description}</p>
               
                <div class="lottery_events_per_ticket_price"> £${event.per_ticket_price}</div>
                <div class="lottery_events_soldpercentage">SOLD: ${event.sold_percentage}%</div>
                <div class="lottery_events_sold_percentage">
                    <div class="lottery_events_sold_bar" style="width: ${event.sold_percentage}%"></div>
                </div>


                ${enterNowButton}
            `;


            categoryEventsContainer.appendChild(eventElement);
        });


        categoryElement.appendChild(categoryEventsContainer);
        container.appendChild(categoryElement);
    });

    setupScrollHandler();
    attachAddToCartListeners(); 
}

//lottery_events.html--adminpanel module--views.py function class BannerView(APIView):--#ID:LP-I7-start
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
                          <button class="db-banner" onclick="scrollToHowToPlay()">How to play</button>
                    <img src="${data.image}" alt="${data.title || 'Lottery Banner'}" class="banner-image">
                <div class="banner-footer">
                    <div class="banner-footer-item">
                        <img src="/media/banner-footer/banner-footer (3).png" alt="Prize Icon">
                        <div>
                            <p>£1,833,777</p>
                            <span>Given in Prizes</span>
                        </div>
                    </div>
                    <div class="banner-footer-item">
                   <img src="/media/banner-footer/banner-footer (4).png" alt="Prize Icon">
                        <div>
                        <p>£81,567,000</p>
                        <span>Given in Prizes</span>
                        </div>
                </div>
                <div class="banner-footer-item">
                     <img src="/media/banner-footer/banner-footer (2).png" alt="Google Reviews">
                        <div>
                            <p>Google Reviews</p>
                            <p>
                                <i class="fas fa-star"></i> 
                                <i class="fas fa-star"></i> 
                                <i class="fas fa-star"></i> 
                                <i class="fas fa-star"></i> 
                                <i class="fas fa-star-half-alt"></i>
                            </p>
                           <p> <a href="#"target="_blank">Click Here 1532 Reviews</a> </p>
                        </div>
                </div>
              <div class="banner-footer-item">
    <a href="#" target="_blank">
        <img src="/media/banner-footer/banner-footer (1).png" alt="Trustpilot Logo" class="trustpilot-image">
    </a>
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
//lottery_events.html--adminpanel module--views.py function class BannerView(APIView):--#ID:LP-I7-end
//lottery_events.html--adminpanel module--views.py function class PreviousWinnersimgAPIView(APIView):--#ID:LP-I7-start
async function fetchWinners_mainpage() {
    try {
        const response = await fetch(winnersUrl_mainpage);
        if (!response.ok) {
            throw new Error(`Error fetching winners: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        const initialWinners = data.winners.slice(0, 8);
        renderWinners_mainpage(initialWinners, false, [3, 3, 3]);
    } catch (error) {
        console.error("Failed to fetch winners:", error);
    }
}

function toggleWinners_mainpage() {

    window.location.href = '/winners';
}

function renderWinners_mainpage(winners, append, rowLimit) {
    const container = document.getElementById("previous_winner_section");
    container.innerHTML = "";

    let rowIndex = 0;
    let count = 0;
    let row;

    winners.forEach((winner, index) => {
        if (count === rowLimit[rowIndex]) {
            rowIndex++;
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
            <img src="${winner.image_url}" alt="${winner.winner_name}" class="previous-mainpage-winner-image">
        `;
        row.appendChild(winnerDiv);
        count++;
    });
}
//lottery_events.html--adminpanel module--views.py function class PreviousWinnersimgAPIView(APIView):--#ID:LP-I7-end
//category_lottery_events.html--adminpanel module--views.py class BannerView(APIView): --#ID:LP-I82 -start
async function category_fetchBanner() {
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


        const bannerContainer = document.getElementById('category_banner_container');
        if (data.image) {
            bannerContainer.innerHTML = `
                <div class="category_custom-banner">
                    
                    <img src="${data.image}" alt="${data.title || 'Lottery Banner'}" class="category_banner-image">
                
                    </div>
                
            `;
        } else {
            console.error('No banner data available');
            bannerContainer.innerHTML = `<p class="error-message">Unable to load banner at this time.</p>`;
        }
    } catch (error) {
        console.error('Error fetching banner:', error);
        const bannerContainer = document.getElementById('category_banner_container');
        bannerContainer.innerHTML = `<p class="error-message">Unable to load banner at this time.</p>`;
    }
}
//category_lottery_events.html--adminpanel module--views.py class BannerView(APIView): --#ID:LP-I82 -end
//category_lottery_events.html--adminpanel module--views.py function class APIGetCategoryLotteryEvents(APIView): --#ID:LP-I82 -start
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
    const container = document.getElementById('category_lottery_events_container');
    const loadMoreWrapper = document.getElementById('load-more-wrapper');
    const loadMoreButton = document.getElementById('load-more-button');

    container.innerHTML = '';

    if (events.length === 0) {
        container.innerHTML = '<p>No lottery events available in this category.</p>';
        loadMoreWrapper.style.display = 'none';
        return;
    }

    events = events.filter(event => event.is_active); 
    let visibleCount = 8; 

    function renderEvents() {
        container.innerHTML = ''; 

        events.slice(0, visibleCount).forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.classList.add('category_lottery_event');

            const drawDateString = event.is_active
                ? lottery_events_formatDrawDate(event.draw_date)
                : 'Inactive';
            const favoriteClass = event.is_favorite ? 'favorited' : '';
            const favoriteIcon = `
                <div class="category_lottery_events_favorite" onclick="toggleFavorite('${event.slug}')">
                    <i class="fas fa-heart ${favoriteClass}"></i>
                </div>`;

            const enterNowButton = `<a href="/lottery_detail/${event.slug}/" class="category_lottery_enter_button">
                <img src="${event.category.category_logo}" alt="${event.category.name} Logo" class="category_lottery_enter_icon"> 
                Enter now  
                <img src="/media/lottery_images/arrow (2).png" alt="Arrow Icon">
            </a>`;

            eventElement.innerHTML = `
                ${favoriteIcon}
                <div class="category_lottery_event_header">${drawDateString}</div>
                ${event.image ? `<img src="${event.image}" alt="${event.title}" class="category_lottery_image" />` : ''}
                 <div style="color: #FF6600; font-size: 14px; font-family: Rajdhani; font-weight: 600; word-wrap: break-word">Automated Draw</div>
                <h3 class="category_lottery_title">${event.title}</h3>
                <p class="category_lottery_description"> ${event.description}</p>
                <div class="category_lottery_ticket_price">£${event.per_ticket_price}</div>
                <div class="category_lottery_events_soldpercentage">SOLD: ${event.sold_percentage}%</div>
                <div class="category_lottery_sold_percentage">
                    <div class="category_lottery_sold_bar" style="width: ${event.sold_percentage}%"></div>
                </div>
                
                ${enterNowButton}
            `;

            container.appendChild(eventElement);
        });

        
        if (visibleCount < events.length) {
            loadMoreWrapper.style.display = 'block';
        } else {
            loadMoreWrapper.style.display = 'none'; 
        }
    }

    
    loadMoreButton.onclick = function () {
        visibleCount += 4;
        renderEvents();
    };

    
    renderEvents();


    window.addEventListener('resize', renderEvents);
}
//category_lottery_events.html--adminpanel module--views.py function class APIGetCategoryLotteryEvents(APIView): --#ID:LP-I82 -end


//lottery_detail.html--adminpanel module--views.py function def add_to_cart(request): --#ID:LP-I63-start-----!
function addToCart(event, redirectToCart = false) {
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
                
                updateCartCount();
                if (redirectToCart) {
                    
                    window.location.href = cartUrl;
                } else {
                    
                    showModal(data.message);
                }
            }
        })
        .catch(error => {
            showModal(error.message); 
            console.error('Error adding to cart:', error);
        });
}

function showModal(message) {
    const modal = document.getElementById('cart-modal');
    const modalMessage = document.getElementById('cart-modal-message');

    modalMessage.textContent = message;
    modal.classList.remove('hiddencart');
    modal.style.display = 'flex';

    
    const closeButton = document.querySelector('.cart-modal-close');
    closeButton.addEventListener('click', () => {
        closeModal(modal);
    });

    
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });

    
    const keepShoppingButton = document.getElementById('cart-keep-shopping');
    keepShoppingButton.addEventListener('click', () => {
        closeModal(modal);
    });

    
    const viewCartButton = document.getElementById('cart-view-cart');
    viewCartButton.addEventListener('click', () => {
        window.location.href = cartUrl;
    });
}


function closeModal(modal) {
    modal.style.display = 'none';
}

//lottery_detail.html--adminpanel module--views.py function def add_to_cart(request): --#ID:LP-I63-end-----!
function getCSRFToken() {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}


function attachAddToCartListeners() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-button');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart);
    });
    const buyNowButton = document.getElementById('buy-now-button');
    if (buyNowButton) {
        buyNowButton.addEventListener('click', function (event) {
            addToCart(event, true); 
        });
    }
}


document.addEventListener('DOMContentLoaded', () => {
    if (typeof lottery_events_fetch === 'function') {
        lottery_events_fetch(); 
    }
    attachAddToCartListeners(); 
});

//cart.html--adminpanel module--views.py function def get_cart(request):--#ID:LP-I63-start
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

document.addEventListener("DOMContentLoaded", () => {
    // fetchCartItems();
    if (document.getElementById("cart_items_container")) {
        fetchCartItems();
    }
    
});
function displayCartItems(cart) {
    const container = document.getElementById('cart_items_container');
    const totalElement = document.getElementById('cart_total');
    const subtotalElement = document.getElementById('totalsub');
    container.innerHTML = ''; 
    let total = 0;
    
    if (Object.keys(cart).length === 0) {
        container.innerHTML = '<p id="empty-cart-page">Your cart is empty</p>';
        totalElement.textContent = '£00.00';
        subtotalElement.textContent = '£00.00';
        return;
    }

    for (const [eventSlug, item] of Object.entries(cart)) {
        
        const itemTotal = parseFloat(item.per_ticket_price) * item.quantity;
        
        if (item.quantity === 0) {
            continue;
        }
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart_item');

        const purchasedQuantity = item.purchased_quantity || 0;
        const remainingTickets = item.max_limit - purchasedQuantity;       
        const adjustedQuantity = Math.min(item.quantity, remainingTickets);
        cartItem.innerHTML = `
            ${item.image ? `<a href="/lottery_detail/${eventSlug}/"><img src="${item.image}" alt="${item.title}" class="cart-image" /></a>` : ''}
            <div class="item-details">
                <h3>${item.title}</h3>
                <p class="cartprice">Per Ticket Price £${item.per_ticket_price}</p>
                
            </div>
            <div class="quantity-controls">
                <p>Quantity:</p>
                <button class="quantity-decrease" data-event-slug="${eventSlug}">-</button>
                <input type="number" min="1" max="${remainingTickets}" value="${adjustedQuantity}" class="quantity-input" data-event-slug="${eventSlug}" />
                <button class="quantity-increase" data-event-slug="${eventSlug}">+</button>
            </div>
            <div class="total-section">
                <p>Total Amount : £</p>
                <input type="number" min="${item.per_ticket_price}" step="${item.per_ticket_price}" value="${(adjustedQuantity * item.per_ticket_price).toFixed(2)}" class="total-input" data-event-slug="${eventSlug}"/>
            </div>
            <button class="remove_from_cart_button" data-event-slug="${eventSlug}"></button>
            <span class="max-limit-message"></span>
        `;

        container.appendChild(cartItem);
    }

    totalElement.textContent = `£${total.toFixed(2)}`;
    subtotalElement.textContent = `£${total.toFixed(2)}`;

    const removeButtons = document.querySelectorAll('.remove_from_cart_button');
    removeButtons.forEach(button => {
        button.addEventListener('click', removeFromCart);
    });

    attachCartEventListeners(cart);


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
                messageSpan.style.color = 'red';
                messageSpan.style.fontSize = '16px';
            
        } else if (newQuantity < 1) {
            event.target.value = 1;
            const parentElement = event.target.closest('.cart_item');
            const totalInput = parentElement.querySelector('.total-input');
            const perTicketPrice = parseFloat(cart[eventSlug].per_ticket_price);
            
            totalInput.value = (1 * perTicketPrice).toFixed(2);
        
            cart[eventSlug].quantity = 1;
            updateCart_total_and_subtotal(cart);
        }else {
                messageSpan.textContent = ''; 
                updateCartQuantity(event, cart, newQuantity - cart[eventSlug].quantity);
            }
        });
    });

   
const totalInputs = container.querySelectorAll('.total-input');


totalInputs.forEach(input => {
    input.addEventListener('blur', event => {
        const eventSlug = event.target.getAttribute('data-event-slug');
        let newTotal = parseFloat(event.target.value);
        const perTicketPrice = parseFloat(cart[eventSlug].per_ticket_price);
        const maxLimit = parseInt(cart[eventSlug].max_limit);
        const maxTotal = perTicketPrice * maxLimit;
       
        const purchasedQuantity = cart[eventSlug].purchased_quantity || 0;
        const remainingTickets = maxLimit - purchasedQuantity; 
        const maxAllowedTotal = perTicketPrice * remainingTickets; 

        const parentElement = event.target.closest('.cart_item');
        const messageSpan = parentElement.querySelector('.max-limit-message');
        const quantityInputs = parentElement.querySelector('.quantity-input'); 

        let calculatedQuantity = Math.floor(newTotal / perTicketPrice);

        
        if (isNaN(newTotal) || newTotal <= 0) {
            calculatedQuantity = remainingTickets;
            newTotal = remainingTickets * perTicketPrice;
            event.target.value = newTotal.toFixed(2);  
        }

    

        if (calculatedQuantity > remainingTickets) {
            event.target.value = maxAllowedTotal.toFixed(2);
            messageSpan.textContent = `Total of remaining ticket price: £${maxAllowedTotal.toFixed(2)}.`;
            messageSpan.style.color = 'red';
            messageSpan.style.fontSize = '16px';
            messageSpan.style.display = 'inline';

            quantityInputs.value = remainingTickets;
            return;
        }

        if (calculatedQuantity > maxLimit) {
            event.target.value = maxTotal.toFixed(2);
            messageSpan.textContent = `Max limit reached: ${maxLimit} tickets (Total: £${maxTotal.toFixed(2)}).`;
            messageSpan.style.color = 'red';
            messageSpan.style.fontSize = '16px';
            messageSpan.style.display = 'inline';

            quantityInputs.value = maxLimit;
            return;
        }

        if (calculatedQuantity >= 1) {
            quantityInputs.value = calculatedQuantity;
            cart[eventSlug].quantity = calculatedQuantity;
//cart.html--adminpanel module--views.py function def get_cart(request):--#ID:LP-I63-end
//cart.html--adminpanel module--views.py function def update_cart(request):   --#ID:LP-I63-start        
            fetch('/api/update-cart/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify({ event_slug: eventSlug, quantity: calculatedQuantity }),
            }).then(() => fetchCartItems());
        }
    });
});

}
function updateCart_total_and_subtotal(cart) {
    let total = 0;

    Object.values(cart).forEach(item => {
        total += item.per_ticket_price * item.quantity;
    });

    document.getElementById('cart_total').textContent = `£${total.toFixed(2)}`;
    document.getElementById('totalsub').textContent = `£${total.toFixed(2)}`;
}

function attachCartEventListeners(cart) {
    const quantityInputs = document.querySelectorAll('.quantity-input');
    quantityInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            const eventSlug = event.target.getAttribute('data-event-slug');
            const remainingTickets = cart[eventSlug].max_limit - (cart[eventSlug].purchased_quantity || 0);
            const newQuantity = parseInt(event.target.value);

            if (newQuantity > remainingTickets) {
                event.target.value = remainingTickets;
                cart[eventSlug].quantity = remainingTickets;
                updateCart(cart);
            } else {
                cart[eventSlug].quantity = newQuantity;
                updateCart(cart);
            }
        });
    });
    const increaseButtons = document.querySelectorAll('.quantity-increase');
    const decreaseButtons = document.querySelectorAll('.quantity-decrease');

    increaseButtons.forEach(button => {
        button.addEventListener('click', event => updateCartQuantity(event, cart, 1));
    });

    decreaseButtons.forEach(button => {
        button.addEventListener('click', event => updateCartQuantity(event, cart, -1));
    });
}
//cart.html--adminpanel module--views.py function def update_cart(request):   --#ID:LP-I63-end
//cart.html--adminpanel module--views.py function def update_cart(request): --#ID:LP-I63-start
function updateCartQuantity(event, cart, delta) {
    const eventSlug = event.target.getAttribute('data-event-slug');
    const currentQuantity = parseInt(cart[eventSlug].quantity);
    const maxLimit = parseInt(cart[eventSlug].max_limit);
    const purchasedQuantity = parseInt(cart[eventSlug].purchased_quantity || 0);
    const remainingTickets = maxLimit - purchasedQuantity;
    const newQuantity = currentQuantity + delta;
    
    const parentElement = event.target.closest('.cart_item');
    const messageSpan = parentElement.querySelector('.max-limit-message');

    if (newQuantity > remainingTickets) {
        if (messageSpan) {
            messageSpan.textContent = `Max limit of ${remainingTickets} reached.`;
            messageSpan.style.color = "red";
            messageSpan.style.fontSize = "16px";
        }
        return;
    } else if (messageSpan) {
        messageSpan.textContent = '';
    }

    if (newQuantity >= 1) {
        cart[eventSlug].quantity = newQuantity;
//cart.html--adminpanel module--views.py function def update_cart(request): --#ID:LP-I63-start
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
                fetchCartItems();
                updateCartCount();
                updateCartCount_cartpage();
            } else {
                alert('Failed to remove item. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error removing item:', error);
        });
}
//cart.html--adminpanel module--views.py function def remove_from_cart(request): --#ID:LP-I63-end
function getCartData() {
    let cart = {};
    document.querySelectorAll('.quantity-input').forEach(input => {
        const eventSlug = input.getAttribute('data-event-slug');
        const quantity = parseInt(input.value, 10);
        if (quantity > 0) {
            cart[eventSlug] = quantity;
        }
    });
    return cart;
}
//cart.html--Payment Service module--views.py function def create_checkout_session,def create_checkout_session --#ID:LP-I106 -start
function proceedToCheckout() {
    const cartData = getCartData();
    if (Object.keys(cartData).length === 0) {
        alert('Your cart is empty.');
        return;
    }

    
    fetch(`/check-user-authentication/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            
            window.location.href = data.redirect_url;
        } else {
            
            fetch(`/create-checkout-session/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({ cart: cartData })
            })
            .then(response => response.json())
            .then(data => {
                if (data.checkout_url) {
                    
                    window.location.href = data.checkout_url;
                } else {
                    alert('Error creating checkout session');
                }
            })
            .catch(error => console.error('Error:', error));
        }
    })
    .catch(error => console.error('Error:', error));
}
//cart.html--Payment Service module--views.py function def create_checkout_session,def create_checkout_session --#ID:LP-I106 -end


//lottery_detail.html
function fetchLotteryEventDetails(eventSlug) {
    fetch(`/api/lottery_detail/${eventSlug}/`)
        .then(response => response.json())
        .then(data => {
            if (!data) {
                console.error("No data received from API.");
                return;
            }

            // DOM Elements
            const eventImage = document.getElementById("lot-detail-event-image");
            const additionalImagesContainer = document.getElementById("additional-images-containerpopup");
            const popup = document.getElementById("lot-detail-image-popup");
            const popupImage = document.getElementById("lot-detail-popup-image");
            const closePopup = document.getElementById("lot-detail-close-popup");
            const prevImageBtn = document.getElementById("lot-detail-prev-image");
            const nextImageBtn = document.getElementById("lot-detail-next-image");
            const competitionDetailsList = document.getElementById("lot-detail-competition-list");
            const ticketInput = document.getElementById("lot-detail-ticket-count");
            const amountInput = document.getElementById("lot-detail-total-amount");
            const errorMessage = document.getElementById("ticket-error-message");

            const perTicketPrice = parseFloat(data.per_ticket_price) || 0;
            const miniLimit = parseInt(data.mini_limit);
            const maxLimit = parseInt(data.max_limit);

            let currentIndex = 0;

            // Populate Event Details
            document.getElementById("lot-detail-event-title").textContent = data.title || "N/A";
            document.getElementById("lot-detail-event-description").textContent = data.description || "N/A";
            
            document.getElementById("lot-detail-event-per-ticket-price").textContent = `Per ticket price: £${data.per_ticket_price || 0}`;
            document.getElementById("event-sold-percentage").textContent = `Sold: ${data.sold_percentage || 0}%`;
            document.getElementById("lot-detail-ticket-max-limit").textContent = maxLimit;

            // Format and display draw date
            document.getElementById("lot-detail-event-draw-datetime").textContent = lottery_events_formatDrawDate(data.draw_date);

            // Update Primary Event Image
            if (data.image) {
                eventImage.src = data.image;
            }

            // Populate Additional Images & Popup
            if (Array.isArray(data.additional_images) && data.additional_images.length > 0) {
                data.additional_images.forEach((img, index) => {
                    const imgElement = document.createElement("img");
                    imgElement.src = img.image;
                    imgElement.alt = "Additional Image";
                    imgElement.classList.add("lot-detail-additional-image");
                    additionalImagesContainer.appendChild(imgElement);

                    // Add click event to show popup
                    imgElement.addEventListener("click", () => showPopup(index));
                });

                const additionalImages = document.querySelectorAll(".lot-detail-additional-image");

                function showPopup(index) {
                    currentIndex = index;
                    popupImage.src = additionalImages[currentIndex].src;
                    document.getElementById("lot-detail-current-image-index").textContent = currentIndex + 1;
                    document.getElementById("lot-detail-total-images").textContent = additionalImages.length;
                    popup.classList.remove("hidden");
                }

                closePopup.addEventListener("click", () => popup.classList.add("hidden"));
                popup.addEventListener("click", (e) => e.target === popup && popup.classList.add("hidden"));

                nextImageBtn.addEventListener("click", () => {
                    currentIndex = (currentIndex + 1) % additionalImages.length;
                    showPopup(currentIndex);
                });

                prevImageBtn.addEventListener("click", () => {
                    currentIndex = (currentIndex - 1 + additionalImages.length) % additionalImages.length;
                    showPopup(currentIndex);
                });
            }

            // Populate Competition Details
            if (data.competition_details && data.competition_details.trim() !== "") {
                const details = data.competition_details.split("\n").filter(detail => detail.trim() !== "");
                details.forEach(detail => {
                    const listItem = document.createElement("li");
                    listItem.textContent = detail.trim();
                    competitionDetailsList.appendChild(listItem);
                });
            } else {
                competitionDetailsList.textContent = "No competition details available.";
            }

            // Initialize Ticket and Amount Fields
            ticketInput.value = miniLimit;
            amountInput.value = (miniLimit * perTicketPrice).toFixed(2);

            function showError(message) {
                errorMessage.textContent = message;
                errorMessage.style.display = "block";
            }

            function clearError() {
                errorMessage.textContent = "";
                errorMessage.style.display = "none";
            }

            function updateAmount() {
                let ticketCount = parseInt(ticketInput.value);

                if (isNaN(ticketCount)) return;
                if (ticketCount < miniLimit || ticketCount > maxLimit) {
                    showError(`Enter a quantity between ${miniLimit} and ${maxLimit}.`);
                } else {
                    clearError();
                    amountInput.value = (ticketCount * perTicketPrice).toFixed(2);
                }
            }

           function updateTicketCount() {
    let enteredAmount = parseFloat(amountInput.value);
    if (isNaN(enteredAmount)) return;

    let calculatedTickets = Math.floor(enteredAmount / perTicketPrice);
    let maxAmount = maxLimit * perTicketPrice;

    if (calculatedTickets < miniLimit || calculatedTickets > maxLimit) {
        showError(`Enter an amount between £${(miniLimit * perTicketPrice).toFixed(2)} and £${maxAmount.toFixed(2)}.`);
    } else {
        clearError();
        ticketInput.value = calculatedTickets;
    }
}

            function adjustTicketInput() {
                let ticketCount = parseInt(ticketInput.value);
                if (isNaN(ticketCount)) return;

                ticketCount = Math.max(miniLimit, Math.min(ticketCount, maxLimit));
                ticketInput.value = ticketCount;
                amountInput.value = (ticketCount * perTicketPrice).toFixed(2);
            }

            function adjustAmountInput() {
                let calculatedTickets = Math.floor(parseFloat(amountInput.value) / perTicketPrice);
                calculatedTickets = Math.max(miniLimit, Math.min(calculatedTickets, maxLimit));
                ticketInput.value = calculatedTickets;
                amountInput.value = (calculatedTickets * perTicketPrice).toFixed(2);
            }

            // Increment / Decrement Ticket Count
            document.getElementById("lot-detail-increment-ticket").addEventListener("click", () => {
                clearError();
                let currentValue = parseInt(ticketInput.value) || miniLimit;

                if (currentValue < maxLimit) {
                    ticketInput.value = currentValue + 1;
                    amountInput.value = ((currentValue + 1) * perTicketPrice).toFixed(2);
                } else {
                    showError(`Maximum ticket limit reached (${maxLimit}).`);
                }
            });

            document.getElementById("lot-detail-decrement-ticket").addEventListener("click", () => {
                clearError();
                let currentValue = parseInt(ticketInput.value) || miniLimit;
                if (currentValue > miniLimit) {
                    ticketInput.value = currentValue - 1;
                    amountInput.value = ((currentValue - 1) * perTicketPrice).toFixed(2);
                } else {
                    showError(`Minimum ticket limit reached (${miniLimit}).`);
                }
            });

            // Event Listeners
            ticketInput.addEventListener("input", updateAmount);
            ticketInput.addEventListener("blur", adjustTicketInput);
            amountInput.addEventListener("input", updateTicketCount);
            amountInput.addEventListener("blur", adjustAmountInput);

            // Allow only valid inputs
            ticketInput.addEventListener("keypress", (event) => {
                if (!/\d/.test(event.key)) event.preventDefault();
            });

            amountInput.addEventListener("keypress", (event) => {
                if (!/\d/.test(event.key) && event.key !== "." && event.key !== "Backspace") {
                    event.preventDefault();
                }
            });

        }).catch(error => console.error("Error fetching data:", error));
}
function fetchSimilarLotteryEvents(eventSlug) {
    fetch(`/api/similar_lottery_events/${eventSlug}/`)
        .then(response => response.json())
        .then(data => {
            const activeEvents = data.filter(event => event.is_active);
            const container = document.getElementById('similar-lottery-events-container');
            const leftBtn = document.getElementById('scroll-left');
            const rightBtn = document.getElementById('scroll-right');


            container.innerHTML = ""; // Clear previous content


            if (activeEvents.length === 0) {
                container.innerHTML = `<div class="no-similar-lotteries"><p>No similar lotteries available at the moment.</p></div>`;
                // Hide scroll buttons if no similar events are available
                leftBtn.style.display = 'none';
                rightBtn.style.display = 'none';
                return;
            }


            activeEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.classList.add('similar_category_lottery_event');
                const favoriteClass = event.is_favorite ? 'favorited' : '';

                eventElement.innerHTML = `
                    <div class="similar_category_lottery_event_favorite" onclick="toggleFavoriteSimilar('${event.slug}')">
                        <i class="fas fa-heart ${favoriteClass}"></i>
                    </div>
                    <div class="similar_category_lottery_event_draw_date">${lottery_events_formatDrawDate(event.draw_date)}</div>
                    ${event.image ? `<img src="${event.image}" alt="${event.title}" class="similar_category_lottery_event_img" />` : ''}
                     <div style="color: #FF6600; font-size: 14px; font-family: Rajdhani; font-weight: 600; word-wrap: break-word">Automated Draw</div>
                    <h3 class="similar_category_lottery_title">${event.title}</h3>
                    <p class="similar_category_lottery_description">${event.description}</p>
                    <div class="similar_category_lottery_per_ticket_price">£${event.per_ticket_price}</div>
                    <div class="favorite_lottery_events_soldpercentage">SOLD: ${event.sold_percentage}%</div>
                    <div class="similar_category_lottery_sold_percentage">
                        <div class="similar_category_lottery_sold_bar" style="width: ${event.sold_percentage}%"></div>
                    </div>
                    
                    <a href="/lottery_detail/${event.slug}/" class="similar_category_lottery_enter_button">
                    <img src="${event.category.category_logo}" alt="${event.category.name} Logo" class="similar_category_lottery_enter_icon"> 
                    Enter now
                 <img src="/media/lottery_images/arrow (2).png" alt="Arrow Icon">
                    </a>
                `;


                container.appendChild(eventElement);
            });


            // Initialize scroll buttons if there are more than 3 events
            setupScrollButtons(activeEvents.length);


        })
        .catch(error => console.error('Error fetching similar lottery events:', error));
}
function setupScrollButtons(eventCount) {
    const container = document.getElementById('similar-lottery-events-container');
    const leftBtn = document.getElementById('scroll-left');
    const rightBtn = document.getElementById('scroll-right');

    const screenWidth = window.innerWidth;


    // Determine device type and set conditions
    const isMobile = screenWidth <= 768;
    const isTablet = screenWidth > 768 && screenWidth <= 1024;


    // Define when buttons should appear
    const shouldShowButtons = isMobile ? eventCount > 1 : isTablet ? eventCount > 2 : eventCount > 3;


    if (shouldShowButtons) {
        leftBtn.style.display = 'block';
        rightBtn.style.display = 'block';


        // Set scroll amount dynamically
        let scrollAmount;
        if (isMobile) {
            scrollAmount = 250;
        } else if (isTablet) {
            scrollAmount = 350;
        } else {
            scrollAmount = 400;
        }


        leftBtn.addEventListener('click', () => {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });

        });


        rightBtn.addEventListener('click', () => {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    } else {
        leftBtn.style.display = 'none';
        rightBtn.style.display = 'none';
        // **Disable scroll for mobile when only 1 event exists**
        if (isMobile && eventCount === 1) {
            container.style.overflowX = 'hidden'; // Prevent horizontal scroll
        } else {
            container.style.overflowX = 'auto'; // Allow scrolling when needed
        }
    }
}
// Handle window resize events
window.addEventListener('resize', function () {
    const container = document.getElementById('similar-lottery-events-container');
    const eventCount = container.children.length;
    setupScrollButtons(eventCount);
});



//favorites.html--adminpanel module--views.py function def get_favorites --#ID:LP-I17-start
function fetchFavorites() {
    fetch('/api/get_favorites/')
        .then(response => response.json())
        .then(data => {
            allFavorites = data.favorites; 
            displayFavorites(); 
        })
        .catch(error => console.error('Error fetching favorites:', error));
}

function displayFavorites() {
    const container = document.getElementById('favorites_container');
    const loadMoreBtn = document.getElementById('load_more_button');
    container.innerHTML = ''; 

    const isMobile = window.innerWidth <= 768;

    let favoritesToShow = isMobile ? allFavorites : allFavorites.slice(0, displayedCount);


    if (favoritesToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center;font-weight:500; font-size: 27px;">You haven’t added any favorites yet.</p>';
        loadMoreBtn.style.display = 'none'; 
        container.style.minHeight = "70vh";
        return;
    }
    container.style.minHeight = "auto"; 

    favoritesToShow.forEach(event => {
        const favoriteElement = document.createElement('div');
        favoriteElement.classList.add('favorite_event');


        const formattedDrawDate = lottery_events_formatDrawDate(event.draw_date);
        const favoriteClass = event.is_favorite ? 'favorited' : '';


        favoriteElement.innerHTML = `
            <div class="favorite_lottery_events_favorite" onclick="toggleFavorite('${event.slug}')">
                <i class="fas fa-heart ${favoriteClass}"></i> 
            </div>
            <p class="favorite_lottery_events_event_header">${formattedDrawDate}</p>
            ${event.image ? `<img src="${event.image}" alt="${event.title}" class="favorite_lottery_image"/>` : ''}
            <div style="color: #FF6600; font-size: 14px; font-family: Rajdhani; font-weight: 600; word-wrap: break-word">Automated Draw</div>
            <h3 class="favorite_lottery_events_event">
                <p class="favorite_lottery_events_event_title">${event.title}</p>
            </h3>
            <p class="favorite_lt-p">${event.description}</p>
            <div class="favorite_lottery_events_per_ticket_price">£${event.per_ticket_price}</div>
              <div class="favorite_lottery_events_soldpercentage">SOLD: ${event.sold_percentage}%</div>
            <div class="favorite_lottery_events_sold_percentage">
                <div class="favorite_lottery_events_sold_bar" style="width: ${event.sold_percentage}%"></div>
            </div>
            
       <a href="${event.enter_now_button}" class="favorite_lottery_events_enter_button">
                Enter Now <img src="/media/lottery_images/arrow (2).png" alt="Arrow Icon">
            </a>
        `;


        container.appendChild(favoriteElement);
    });


    if (!isMobile && allFavorites.length > displayedCount) {
        loadMoreBtn.style.display = 'block';
    } else {
        loadMoreBtn.style.display = 'none';
    }
}


function loadMoreFavorites() {
    displayedCount += 4; 
    displayFavorites(); 
}

window.addEventListener('resize', displayFavorites);
//favorites.html--adminpanel module--views.py function def get_favorites --#ID:LP-I17-end
//favorites.html--adminpanel module--views.py function def add_to_favorites--#ID:LP-I17-start
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
            fetchFavorites(); 
            lottery_events_fetch();
            fetchCategoryLotteryEvents();
            if (data.success) {
                favoriteIcon.classList.toggle('favorited'); 
            }
        })
        .catch(error => console.error('Error toggling favorite:', error));
}
//favorites.html--adminpanel module--views.py function def add_to_favorites--#ID:LP-I17-end
/*Userdashboard*/
document.addEventListener("DOMContentLoaded", function () { 
    let chatbot = document.getElementById("chatbotPopup");
    chatbot.style.display = "block";

    // Automatically close it after 3 seconds (3000 milliseconds)
    setTimeout(function () {
        chatbot.style.display = "none";
    }, 3000);
});
function toggleChatbot() {
    let chatbot = document.getElementById("chatbotPopup");
    chatbot.style.display = chatbot.style.display === "block" ? "none" : "block";
}
function closeChatbot() {
    document.getElementById("chatbotPopup").style.display = "none";
}

function scrollToHowToPlay() {
    document.getElementById("how-to-play").scrollIntoView({ behavior: "smooth" });
}
function scrollToSubscription() {
    document.getElementById("db_Subscription").scrollIntoView({ behavior: "smooth" });
}
function testimonials() {

    let index = 0;
    const slides = document.querySelectorAll(".testimonial-slide");
    const dots = document.querySelectorAll(".dot");

    if (slides.length === 0 || dots.length === 0) {
        console.warn("No testimonials found.");
        return;
    }

    function updateSlide() {
        slides.forEach(slide => slide.classList.remove("active"));
        dots.forEach(dot => dot.classList.remove("active"));

        slides[index].classList.add("active");
        dots[index].classList.add("active");
    }

    function autoSlide() {
        index = (index + 1) % slides.length;
        updateSlide();
    }

    dots.forEach((dot, i) => {
        dot.addEventListener("click", function () {
            index = i;
            updateSlide();
        });
    });

    setInterval(autoSlide, 10000);
    updateSlide();

}
/*----------------2-FA----------*/
function privacysecurity() {
    const apiUrl = $("#privacy-form").data("api-url");

    function validateForm() {
        let isValid = true;

        $('.privacy-error').text('');


    // Validate DOB
    const dob = $('#privacy-dob').val();
    if (!dob) {
        $('#privacy-dob-error').text("Date of Birth is required.");
        isValid = false;
    } else {
        const dobDate = new Date(dob);
        const year = dobDate.getFullYear();
        const currentYear = new Date().getFullYear();

        if (year < 1900 || year > currentYear) {
            $('#privacy-dob-error').text("Enter a valid year between 1900 and " + currentYear + ".");
            isValid = false;
        }
    }
        // Validate phone number
        const phoneNumber = $('#privacy-phone-number').val();
        const phoneRegex = /^\+44\d{10}$/;
        if (!phoneNumber) {
            $('#privacy-phone-error').text("Phone number is required.");
            isValid = false;
        } else if (!phoneRegex.test(phoneNumber)) {
            $('#privacy-phone-error').text("Enter a valid UK phone number starting with +441234567890.");
            isValid = false;
        }

        return isValid;
    }

    $('#privacy-save-changes').click(function () {
        if (validateForm()) {
            const csrfToken = $('input[name="csrfmiddlewaretoken"]').val();
            const data = {
                dob: $('#privacy-dob').val(),
                phone_number: $('#privacy-phone-number').val(),
                two_factor_auth_enabled: $('#privacy-two-factor-auth').is(':checked'),
            };

            $.ajax({
                url: apiUrl,
                type: "PUT",
                headers: { "X-CSRFToken": csrfToken },
                contentType: "application/json",
                data: JSON.stringify(data),
                success: function () {
                    $('#privacy-message').text("Privacy settings updated successfully.")
                        .css("color", "green")
                        .show();
                },
                error: function () {
                    $('#privacy-message').text("Failed to save changes.")
                        .css("color", "red")
                        .show();
                }
            });
        }
    });
}

$(document).ready(function () {
    privacysecurity();
});

/** Loader Start**/
$(document).ready(function () {
    
    let preloaderHTML = `
        <div id="preloader">
            <div id="ep-preloader" class="ep-preloader">
                <div class="animation-preloader">
                    <img src="/media/lottery_images/logo.png" alt="Loading..." class="preloader-image" />
                    <div class="spinner"></div>
                </div>
            </div>
        </div>
    `;
    
    $("body").prepend(preloaderHTML);
    
    $("#preloader").show();
});
$(window).on('load', function () {
    
    setTimeout(function () {
        
        $("#preloader").fadeOut(500);
    }, 1000); 
});

//my-order.html--Payment Service module--views.py function def my_order_api --#ID:LP-I121 -start
$(document).ready(function () {
if (typeof my_orders_csrfToken !== 'undefined' && $("#myorders-container").length > 0) {
    function fetchOrders(filter) {
        $.ajax({
            url: `/api/my-orders/?filter=${filter}`,
            type: "GET",
            dataType: "json",
            headers: { "X-CSRFToken": my_orders_csrfToken }, 
            success: function (data) {
                let container = $("#myorders-container");
                container.empty();

                if (Object.keys(data).length === 0) {
container.html(`<div class="empty-state">
  <p>Your order list is empty. <a href='/lottery-events/' class='btn-link'>Browse items</a> to get started!</p>
</div>`);

                    return;
                }

                $.each(data, function (sessionId, group) {

                    let winningLotteries = [];
                    group.payments.forEach(payment => {
                        if (payment.winning_tickets && payment.winning_tickets.length > 0) {
                            winningLotteries.push(payment.lottery_event_title);
                        }
                    });
                    
                    
                    winningLotteries = [...new Set(winningLotteries)];
                    
                    let orderHTML = `
                        <div class="myorder-group">
                            <h4>Order ID: <strong>${group.payment_id}</strong></h4>
                            <span class="myorder-status-badge ${group.payment_status === 'completed' ? 'myorder-completed' : 'myorder-refund'}">
                                ${group.payment_status.charAt(0).toUpperCase() + group.payment_status.slice(1)}
                            </span>
                            ${winningLotteries.length > 0 ? 
                              '<span class="myorder-winner-badge">WINNER</span>' : ''}
                            <p><i class="fa fa-calendar"></i> ${group.payment_at ? new Date(group.payment_at).toLocaleDateString() : 'N/A'}
                                &nbsp; <i class="fa fa-clock"></i> ${group.payment_at ? new Date(group.payment_at).toLocaleTimeString() : 'N/A'}</p>
                            <p>Total Amount: £${parseFloat(group.total_amount).toFixed(2)}</p>`;
                    
                    if (group.receipt_url) {
                        orderHTML += `<p><a href="${group.receipt_url}" target="_blank" class="receipt-link">View Receipt</a></p>`;
                    }
                    
                    orderHTML += `<table class="myorder-table">
                                <thead>
                                    <tr>
                                        <th>Quantity</th>
                                        <th>Lottery</th>
                                        <th>Ticket Numbers</th>
                                    </tr>
                                </thead>
                                <tbody>`;

                    $.each(group.payments.slice(0, 2), function (index, payment) {
                        let ticketNumbers = payment.ticket_numbers.slice(0, 1).join(", ");
                        if (payment.ticket_numbers.length > 1) {
                            ticketNumbers += ` , etc...`;
                        }
                        
                        
                        let winnerIndicator = '';
                        if (payment.winning_tickets && payment.winning_tickets.length > 0) {
                            winnerIndicator = '<span class="myorder-ticket-winner-indicator">WINNER</span>';
                        }
                        
                        orderHTML += `
                            <tr>
                                <td><span class="myorder-quantity-box">${payment.quantity}</span></td>
                                <td>${payment.lottery_event_title} ${winnerIndicator}</td>
                                <td>${ticketNumbers}</td>
                            </tr>`;
                    });

                    orderHTML += `</tbody></table>`;

                    if (group.payments.length > 2) {
                        orderHTML += `<p>${group.payments.length - 2} More items</p>`;
                    }

                    orderHTML += `
                        <div class="myorder-button-container">
                            <button class="myorder-button myorder-details-button" onclick="showModal('${sessionId}')">Details</button>
                            <button class="myorder-button myorder-help-button" onclick="getHelp('${sessionId}')">Get Help</button>
                        </div>

                        <div id="myorder-modal-${sessionId}" class="myorder-modal">
                            <div class="myorder-modal-content">
                                <span class="myorder-close" onclick="closeModal('${sessionId}')">&times;</span>
                                <h4>Order ID: <strong>${group.payment_id}</strong></h4>
                                <p>Status: ${group.payment_status.charAt(0).toUpperCase() + group.payment_status.slice(1)}</p>
                                ${winningLotteries.length > 0 ? 
                                  `<p class="myorder-winner-notice">Congratulations! You won ${winningLotteries.length > 1 ? 'these lotteries' : 'this lottery'}: ${winningLotteries.join(', ')}!</p>` : ''}
                                <p>Total Amount: £${parseFloat(group.total_amount).toFixed(2)}</p>
                                <table class="myorder-table">
                                    <thead>
                                        <tr>
                                            <th>Quantity</th>
                                            <th>Lottery</th>
                                            <th>Amount</th>
                                            <th>Ticket Numbers</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;

                    $.each(group.payments, function (index, payment) {
                        let ticketNumbers = payment.ticket_numbers.map(ticket => {
                            if (payment.winning_tickets && payment.winning_tickets.includes(ticket)) {
                                return `<span class="myorder-winning-ticket">${ticket} (WINNER)</span>`;
                            }
                            return ticket;
                        }).join(", ");
                        
                        let winnerIndicator = '';
                        if (payment.winning_tickets && payment.winning_tickets.length > 0) {
                            winnerIndicator = '<span class="myorder-ticket-winner-indicator">WINNER</span>';
                        }
                        
                        
                        let rowClass = '';
                        if (payment.winning_tickets && payment.winning_tickets.length > 0) {
                            rowClass = 'class="winning-row"';
                        }
                        
                        orderHTML += `
                                        <tr ${rowClass}>
                                            <td><span class="myorder-quantity-box">${payment.quantity}</span></td>
                                            <td>${payment.lottery_event_title}${winnerIndicator}</td>
                                            <td>£${parseFloat(payment.amount).toFixed(2)}</td>
                                            <td>${ticketNumbers}</td>
                                        </tr>`;
                    });
                    if (group.receipt_url) {
                        orderHTML += `<p><a href="${group.receipt_url}" target="_blank" class="receipt-link">View Receipt</a></p>`;
                    }
                    orderHTML += `</tbody></table></div></div></div>`;

                    container.append(orderHTML);
                });
            },
            error: function () {
                $("#orders-container").html("<p>Error loading orders.</p>");
            }
        });
    }

    
    fetchOrders("all");
        
        window.getHelp = function(sessionId) {
        
        localStorage.setItem('help_session_id', sessionId);
        
        window.location.href = '/contact/';
    }
    
    $("#myorder-filter").change(function () {
        let selectedFilter = $(this).val();
        fetchOrders(selectedFilter);
    });


    window.showModal = function (sessionId) {
        $("#myorder-modal-" + sessionId).show();
    }

    window.closeModal = function (sessionId) {
        $("#myorder-modal-" + sessionId).hide();
    }
    
    $(document).on("click", function (event) {
        $(".myorder-modal").each(function () {
            if ($(event.target).closest(".myorder-modal-content").length === 0 && $(event.target).hasClass("myorder-modal")) {
                $(this).hide();
            }
        });
    });
    }
});

function initializeMenuScroll() {
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector(".myorder-sidebar");
        const menu = document.querySelector(".myorder-menu");

        
        const scrollButton = document.createElement("button");
        scrollButton.classList.add("scroll-right");
        scrollButton.innerHTML = "▶";
        sidebar.appendChild(scrollButton);

        
        function checkScrollVisibility() {
            if (menu.scrollWidth > menu.clientWidth) {
                scrollButton.style.display = "block";
            } else {
                scrollButton.style.display = "none";
            }
        }

        
        scrollButton.addEventListener("click", function () {
            menu.scrollBy({ left: 200, behavior: "smooth" });
        });

        menu.addEventListener("scroll", function () {
            if (menu.scrollLeft + menu.clientWidth >= menu.scrollWidth) {
                scrollButton.style.display = "none";
            } else {
                scrollButton.style.display = "block";
            }
        });

        
        checkScrollVisibility();

        
        setTimeout(() => {
            const activeItem = menu.querySelector(".active");
            if (activeItem) {
                activeItem.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest"
                });
            }
        }, 100);

        
        window.addEventListener("resize", checkScrollVisibility);
    }
}
//my-order.html--Payment Service module--views.py function def my_order_api --#ID:LP-I121 -end
document.addEventListener("DOMContentLoaded", initializeMenuScroll);

//Block user popup for mannual login
$(document).ready(function () {
    // Wait for the loader to disappear before showing the modal
    let modal = $("#customModal");
    let messageText = modal.find("p").text().trim();

    // Show modal immediately if it has a message
    if (modal.length && messageText !== "") {
        modal.css("display", "flex");
    }

    // Close modal when clicking the close button
    $(".close").click(function () {
        modal.hide();
    });

    // Close modal when clicking outside of it
    $(window).click(function (event) {
        if ($(event.target).is("#customModal")) {
            modal.hide();
        }
    });
});


function custom_admin_dashboard_lottery_draw_winners_management_function() { 
    let currentEventId = null;
    let currentMethod = null;
    let currentTicketStart = null;
    let currentTicketEnd = null;
    let isAdminVerified = false;
    let isErrorModal = false;
    let currentWinnerDetails = null;
    let currentPage = 1;
    let totalPages = 1;
    const itemsPerPage = 3;

    function showModaldrawwinner(message, showPublish = true) {
        $("#draw-winner-modal-message").html(message);
        
        if (showPublish) {
            $("#publish-winner-container").show();
            isAdminVerified = false;
            $("#draws-otp-verification-container").hide();
            $("#draw-winner-close-modal").show();
            $("#publish-winner").prop("checked", false);
            isErrorModal = false;
            $("#draws-resend-otp").prop("disabled", true);
        } else {
            $("#publish-winner-container").hide();
            $("#draws-otp-verification-container").hide();
            isErrorModal = true;
        }
        
        $("#draw-winner-lottery-modal").fadeIn();
        $("#draw-winner-modal-overlay").fadeIn();
    }

    function closeModaldrawwinner() {
        $("#draw-winner-lottery-modal").fadeOut();
        $("#draw-winner-modal-overlay").fadeOut();
    }

    $("#draw-winner-close-modal, #draw-winner-modal-overlay").click(function () {
        closeModaldrawwinner();
    });

    $(document).mouseup(function (e) {
        let modal = $("#draw-winner-lottery-modal");
        if (!modal.is(e.target) && modal.has(e.target).length === 0) {
            closeModaldrawwinner();
        }
    });

    function showSuccessModal(message) {
        $("#draws-success-message").html(message);
        $("#draws-success-modal").fadeIn();
        $("#draws-success-modal-overlay").fadeIn();
    }
    
    function closeSuccessModal() {
        $("#draws-success-modal").fadeOut();
        $("#draws-success-modal-overlay").fadeOut();
    }
    
    $("#draws-success-modal-close, #draws-success-modal-overlay").click(function() {
        closeSuccessModal();
    });
    
    $(document).mouseup(function(e) {
        let modal = $("#draws-success-modal");
        if (!modal.is(e.target) && modal.has(e.target).length === 0) {
            closeSuccessModal();
        }
    });

    function createPaginationControls(totalItems) {
        totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (totalPages <= 1) {
            return '';
        }

        let paginationHtml = `<div class="pagination-wrapper">`;
        
        // Previous button
        paginationHtml += `
            <button class="pagination-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                Prev
            </button>
        `;

        // Simplified pagination logic
        if (totalPages <= 7) {
            // Show all pages if total pages is 7 or less
            for (let i = 1; i <= totalPages; i++) {
                paginationHtml += `
                    <button class="pagination-btn page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            }
        } else {
            // For more than 7 pages, use ellipsis logic
            let showFirst = true;
            let showLast = true;
            let startPage, endPage;

            if (currentPage <= 4) {
                // Near the beginning
                startPage = 1;
                endPage = 5;
                showFirst = false;
            } else if (currentPage >= totalPages - 3) {
                // Near the end
                startPage = totalPages - 4;
                endPage = totalPages;
                showLast = false;
            } else {
                // In the middle
                startPage = currentPage - 2;
                endPage = currentPage + 2;
            }

            // Add first page and ellipsis if needed
            if (showFirst && startPage > 1) {
                paginationHtml += `<button class="pagination-btn page-btn" data-page="1">1</button>`;
                if (startPage > 2) {
                    paginationHtml += `<span class="pagination-ellipsis">...</span>`;
                }
            }

            // Add page number buttons
            for (let i = startPage; i <= endPage; i++) {
                paginationHtml += `
                    <button class="pagination-btn page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            }

            // Add ellipsis and last page if needed
            if (showLast && endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    paginationHtml += `<span class="pagination-ellipsis">...</span>`;
                }
                paginationHtml += `<button class="pagination-btn page-btn" data-page="${totalPages}">${totalPages}</button>`;
            }
        }

        // Next button
        paginationHtml += `
            <button class="pagination-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                Next
            </button>
        `;

        paginationHtml += `</div>`;
        
        return paginationHtml;
    }

    function loadLotteryEvents(page = 1) {
        currentPage = page;
        
        // Show loading state
        let container = $("#draw-lottery-container");
        container.html('<div class="pagination-loading"><div class="spinner"></div>Loading lottery events...</div>');
        
        $.ajax({
            url: `/api/admin/lottery-draw/?page=${page}&page_size=${itemsPerPage}`,
            type: "GET",
            success: function (response) {
                container.empty();
                
                // Create main content wrapper to ensure proper layout
                let contentWrapper = $('<div class="lottery-content-wrapper" style="width: 100%; display: flex; flex-direction: column;"></div>');
                
                // Create wrapper with heading
                let headerWrapper = $(`
                    <div style="width: 100%; margin-bottom: 20px;">
                        <h2 style="text-align: center; width: 100%; margin: 0;">Lottery Draw</h2>
                    </div>
                `);
                contentWrapper.append(headerWrapper);

                // Create cards container
                let cardsContainer = $('<div class="lottery-cards-container" style="width: 100%;"></div>');
                
                // Create lottery cards
                response.events.forEach(event => {
                    let drawDate = new Date(event.draw_date);
                    let currentDate = new Date();
                    let statusText = drawDate < currentDate ? "Draw Expired" : "Upcoming Draw";
                    let statusColor = drawDate < currentDate ? "red" : "green";

                    let card = `
                        <div class="draws-lottery-card">
                            <p style="color: ${statusColor}; font-weight: bold;">${statusText}</p>
                            <div class="admin_lottery_draw_date">${lottery_events_formatDrawDate(event.draw_date)}</div>
                            <img src="${event.image}" alt="${event.title}">
                            <h3>${event.title}</h3>
                            <p>
                            Active:
                            <i class="${event.is_active ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger'}"></i>
                            </p>
                            <p>SOLD: ${event.sold_percentage}%</p>
                            <label>
                                <input type="radio" name="draw-method-${event.id}" value="method1">
                                Random purchased tickets 
                            </label><br>
                            <label>
                                <input type="radio" name="draw-method-${event.id}" value="method2">
                                Random highest purchased user  
                            </label><br>
                            <label>
                                <input type="radio" name="draw-method-${event.id}" value="method3">
                                Random by Range
                            </label><br>
                            <div class="ticket-range-container">
                            <input type="text" id="ticket-start-${event.id}" class="draws-ticket-range" maxlength="6" placeholder="6 digit number" disabled>
                            <input type="text" id="ticket-end-${event.id}" class="draws-ticket-range" maxlength="6" placeholder="6 digit number" disabled>
                            </div>
                            ${event.winner_chosen 
                                ? `<button class="draws-draw-btn" style="background-color: #28a745; font-weight:bold; color: white;" disabled>Winner Chosen</button>` 
                                : `<button class="draws-draw-btn" data-id="${event.id}">Draw Winner</button>`
                            }
                        </div>
                    `;
                    cardsContainer.append(card);
                });
                
                contentWrapper.append(cardsContainer);

                // Add pagination controls at the bottom only
                if (response.total_count > itemsPerPage) {
                    let paginationContainer = $('<div class="pagination-container" style="width: 100%; margin-top: 20px;"></div>');
                    paginationContainer.html(createPaginationControls(response.total_count));
                    contentWrapper.append(paginationContainer);
                }

                // Append the complete content wrapper to container
                container.append(contentWrapper);

                // Attach event handlers
                attachEventHandlers();
            },
            error: function(xhr, status, error) {
                console.error("Error loading lottery events:", error);
                $("#draw-lottery-container").html("<p>Error loading lottery events. Please try again.</p>");
            }
        });
    }

    function attachEventHandlers() {
        // Radio button change handler
        $("input[type=radio]").change(function () {
            let eventId = $(this).attr("name").split("-")[2];
            let isMethod3 = $(this).val() === "method3";
            $(`#ticket-start-${eventId}, #ticket-end-${eventId}`).prop("disabled", !isMethod3);
        });

        // Draw winner button handler
        $(".draws-draw-btn").click(function () {
            currentEventId = $(this).data("id");
            currentMethod = $(`input[name='draw-method-${currentEventId}']:checked`).val();
            currentTicketStart = $(`#ticket-start-${currentEventId}`).val();
            currentTicketEnd = $(`#ticket-end-${currentEventId}`).val();

            if (!currentMethod) {
                showModaldrawwinner("Please select a method.", false);
                return;
            }

            if (currentMethod === "method3") {
                let ticketRegex = /^\d{6}$/;
                if (!ticketRegex.test(currentTicketStart) || !ticketRegex.test(currentTicketEnd)) {
                    showModaldrawwinner("Please enter a valid 6-digit ticket number in both fields.", false);
                    return;
                }
            }

            $.ajax({
                url: "/api/admin/lottery-draw/",
                type: "POST",
                contentType: "application/json",
                headers: {
                    "X-CSRFToken": pubish_winner_csrfToken
                },
                data: JSON.stringify({ 
                    event_id: currentEventId, 
                    method: currentMethod,
                    ticket_start: currentTicketStart, 
                    ticket_end: currentTicketEnd,
                    publish: false
                }),
                success: function (response) {
                    currentWinnerDetails = response;
                    let message = "";
                    
                    if (currentMethod === "method1" || currentMethod === "method2") {
                        message = `Winner Selected: ${response.winner.ticket_number} (User: ${response.winner.user}) - ${response.winner.selection_method}`;
                    } else if (currentMethod === "method3") {
                        message = `Winner Selected: ${response.ticket_number} (User: ${response.user}) - ${response.selection_method}`;
                    }
                    
                    showModaldrawwinner(message, true);
                },
                error: function (xhr) {
                    showModaldrawwinner(xhr.responseJSON.error, false);
                }
            });
        });

        // Pagination button handlers
        $(".pagination-btn").click(function() {
            if ($(this).prop('disabled') || $(this).hasClass('active')) {
                return;
            }
            
            let targetPage = $(this).data('page');
            if (targetPage && targetPage >= 1 && targetPage <= totalPages) {
                loadLotteryEvents(targetPage);
            }
        });
    }

    // OTP handling (unchanged)
    $("#publish-winner").change(function() {
        if ($(this).is(":checked")) {
            $("#draw-winner-close-modal").hide();
            $("#draws-otp-verification-container").show();
            $("#draws-otp-input").val("");
            $("#draws-otp-status").text("");
            
            $.ajax({
                url: "/api/admin/send-otp/",
                type: "POST",
                headers: {
                    "X-CSRFToken": pubish_winner_csrfToken
                },
                success: function(response) {
                    $("#draws-otp-status").text("OTP sent to your email").css("color", "green");
                },
                error: function(xhr) {
                    $("#draws-otp-status").text("Failed to send OTP").css("color", "red");
                }
            });
        } else {
            $("#draws-otp-verification-container").hide();
            $("#draw-winner-close-modal").show();
            isAdminVerified = false;
        }
    });

    $("#draws-otp-input").blur(function() {
        const otp = $(this).val();
        if (otp.length === 6) {
            $.ajax({
                url: "/api/admin/verify-otp/",
                type: "POST",
                headers: {
                    "X-CSRFToken": pubish_winner_csrfToken
                },
                data: { otp: otp },
                success: function(response) {
                    if (response.verified) {
                        $("#draws-otp-status").text("OTP verified successfully").css("color", "green");
                        isAdminVerified = true;
                        $("#draw-winner-close-modal").show();
                        $("#draws-resend-otp").prop("disabled", true);
                    } else {
                        $("#draws-otp-status").text("Invalid OTP").css("color", "red");
                        isAdminVerified = false;
                        $("#draws-resend-otp").prop("disabled", false);
                    }
                },
                error: function(xhr) {
                    $("#draws-otp-status").text("Error verifying OTP").css("color", "red");
                    isAdminVerified = false;
                    $("#draws-resend-otp").prop("disabled", false);
                }
            });
        }
    });

    $("#draws-resend-otp").click(function() {
        $.ajax({
            url: "/api/admin/send-otp/",
            type: "POST",
            headers: {
                "X-CSRFToken": pubish_winner_csrfToken
            },
            success: function(response) {
                $("#draws-otp-status").text("New OTP sent to your email").css("color", "green");
                $("#draws-otp-input").val("");
            },
            error: function(xhr) {
                $("#draws-otp-status").text("Failed to resend OTP").css("color", "red");
                $("#draws-resend-otp").prop("disabled", false);
            }
        });
    });

    // Updated OK button handler
    $("#draw-winner-close-modal").off("click").on("click", function() {
        if (isErrorModal) {
            closeModaldrawwinner();
            return;
        }
        
        const publish = $("#publish-winner").is(":checked") && isAdminVerified;
        
        if (!publish) {
            closeModaldrawwinner();
            return;
        }

        $.ajax({
            url: "/api/admin/publish-winner/",
            type: "POST",
            contentType: "application/json",
            headers: {
                "X-CSRFToken": pubish_winner_csrfToken
            },
            data: JSON.stringify({
                winner_data: currentWinnerDetails,
                event_id: currentEventId
            }),
            success: function(response) {
                closeModaldrawwinner();
                showSuccessModal("Winner published successfully!");
                isAdminVerified = false;
                // Reload current page to update the UI
                loadLotteryEvents(currentPage);
            },
            error: function(xhr) {
                showModaldrawwinner(xhr.responseJSON.error, false);
            }
        });
    });

    // Initialize the lottery events when container exists
    if ($("#draw-lottery-container").length > 0) {
        loadLotteryEvents(1);
    }
}
/*peronal info .html */
function GetCSRFToken() {
    let csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return csrfToken;
}
function piValidateForm() {
    let isValid = true;
    
    document.querySelectorAll('.pi-error-message').forEach(el => el.textContent = '');

   

    let phone = document.getElementById("pi-phone-number").value.trim();
    let phoneRegex = /^\+44\d{10}$/; 
    if (!phoneRegex.test(phone)) {
        document.getElementById("pi-phone-error").textContent = "Enter a valid UK phone number starting with +44 and followed by 10 digits.";
        isValid = false;
    }

    let address = document.getElementById("pi-address").value.trim();
    if (address === "") {
        document.getElementById("pi-address-error").textContent = "Address is required.";
        isValid = false;
    }

    let website = document.getElementById("pi-website").value.trim();
    if (website && !website.match(/^(https?:\/\/)/)) {
        document.getElementById("pi-website-error").textContent = "Website must start with http:// or https://.";
        isValid = false;
    }

    let profilePhoto = document.getElementById("pi-profile-photo").files[0];
    if (profilePhoto) {
        let validExtensions = ["image/jpeg", "image/png", "image/jpg"];
        if (!validExtensions.includes(profilePhoto.type)) {
            document.getElementById("pi-profile-photo-error").textContent = "Only JPG, PNG, and JPEG files are allowed.";
            isValid = false;
        }
    }

    return isValid;
}

function piPreviewImage(event) {
    let file = event.target.files[0];
    if (file) {
        let validExtensions = ["image/jpeg", "image/png", "image/jpg"];
        if (!validExtensions.includes(file.type)) {
            document.getElementById("pi-profile-photo-error").textContent = "Only JPG, PNG, and JPEG files are allowed.";
            return;
        }
        let reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("pi-profile-preview").src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}
function piUpdateProfile() {
if (!piValidateForm()) {
return;
}

let formData = new FormData();

formData.append("phone_number", document.getElementById("pi-phone-number").value);

let profilePhotoInput = document.getElementById("pi-profile-photo");
if (profilePhotoInput.files.length > 0) {
formData.append("profile_photo", profilePhotoInput.files[0]); 
}

formData.append("address", document.getElementById("pi-address").value);
formData.append("website", document.getElementById("pi-website").value);
formData.append("twitter", document.getElementById("pi-twitter").value);

fetch("/api/personal-info/", {  
method: "PUT",
headers: {
    "X-CSRFToken": GetCSRFToken(), 
},
body: formData
})
.then(response => response.json().then(data => ({ status: response.status, body: data })))
.then(({ status, body }) => {
console.log("Status Code:", status);
console.log("Response:", body);

if (status === 200) {
    alert("Profile updated successfully!");

    // Get the image element
    let profileImg = document.querySelector(".pi-upload-box img"); 
    
    // Ensure the backend returns an updated image URL
    if (profileImg && body.image_url) {  
        let newSrc = body.image_url + "?t=" + new Date().getTime();
        
        // Preload the new image to prevent flickering
        let tempImg = new Image();
        tempImg.onload = function() {
            profileImg.src = newSrc;
        };
        tempImg.src = newSrc;
    }
} else {
    alert("Error: " + JSON.stringify(body));  
}
})
.catch(error => {
console.error("Fetch Error:", error);
});
}
        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                document.cookie.split(';').forEach(cookie => {
                    const trimmed = cookie.trim();
                    if (trimmed.startsWith(name + '=')) {
                        cookieValue = decodeURIComponent(trimmed.substring(name.length + 1));
                    }
                });
            }
            return cookieValue;
        }
/*login_security.html*/
function logoutDevice(sessionKey, button) {
    fetch('/api/logout-device/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ session_key: sessionKey })  // Send session key instead of IP
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // If the current session is logged out, redirect to login page
            if (data.is_current_session) {
                window.location.href = "/login/";
                return;
            }

            // Remove the logged-out session from the UI
            const sessionDiv = button.closest('.unique-session');
            sessionDiv.remove();

            // If no more active sessions exist, show "No active sessions."
            if (document.querySelectorAll('.session').length === 0) {
                document.body.insertAdjacentHTML('beforeend', '<p>No active sessions.</p>');
            }

            alert("Device logged out successfully!");
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}
function showToast(messages, isSuccess = false) {
    const toast = document.getElementById("unique-toast");
  toast.innerHTML = Array.isArray(messages)
    ? messages.map(msg => `${isSuccess ? "✅" : "❌"} ${msg}`).join("<br>")
    : `${isSuccess ? "✅" : "❌"} ${messages}`;


    toast.className = "unique-toast show";
    if (isSuccess) {
        toast.classList.add("success");
    }

    toast.classList.remove("hidden");
      setTimeout(hideToast, 5000);
}
function hideToast() {
    const toast = document.getElementById("unique-toast");
    toast.className = "unique-toast hidden";
}
function updatePassword() {
    const oldPassword = document.getElementById("unique-old-password").value;
    const newPassword = document.getElementById("unique-new-password").value;
    const confirmPassword = document.getElementById("unique-confirm-password").value;

    const errors = [];
    const uppercasePattern = /[A-Z]/;
    const lowercasePattern = /[a-z]/;
    const numberPattern = /\d/g;
    const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;

    if (newPassword.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }
    if (!uppercasePattern.test(newPassword)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    if (!lowercasePattern.test(newPassword)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    if ((newPassword.match(numberPattern) || []).length < 4) {
        errors.push("Password must contain at least four numbers");
    }
    if (!specialCharPattern.test(newPassword)) {
        errors.push("Password must contain at least one special character");
    }
    if (oldPassword === newPassword) {
        errors.push("New password must not be the same as the current password");
    }
    if (newPassword !== confirmPassword) {
        errors.push("Confirm password does not match");
    }
    if (errors.length > 0) {
        showToast(errors);
        return;
    }

    // If validation passes, hide the toast
    hideToast();

    fetch("/update-password/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": getCookie("csrftoken"),
        },
        body: new URLSearchParams({
            old_password: oldPassword,
            new_password1: newPassword,
            new_password2: confirmPassword,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(" Password updated successfully!", true);
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showToast(data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        showToast("Something went wrong");
    });
}

//winner.html--adminpanel module--views.py function def WinnersWallListView--#ID:LP-I159-start
$(document).ready(function () {
    let winnersData = [];
    let drawDates = [];
    let currentPage = 1;
    const datesPerPage = 5;

    function fetchWinnersusersdraw() {
        $.ajax({
            url: "/api/winners-wall/", 
            method: "GET",
            dataType: "json",
            success: function (response) {
                winnersData = response;
                drawDates = Object.keys(response);

                if (drawDates.length === 0) {
                    $("#user-winners-container").html("<h2 class='user-winners-announcement'>🏆 Winners will be announced soon...</h2>");
                    $("#user-winners-pagination").empty();
                    return;
                }

                currentPage = 1;
                renderuserWinners();
                renderuserPagination();
            },
            error: function (error) {
                console.log("Error fetching winners:", error);
            }
        });
    }
    function renderuserWinners() {
        let winnersContainer = $("#user-winners-container");
        winnersContainer.empty();
    
        let startIdx = (currentPage - 1) * datesPerPage;
        let endIdx = startIdx + datesPerPage;
        let paginatedDates = drawDates.slice(startIdx, endIdx);
    
        if (paginatedDates.length === 0) {
            winnersContainer.html("<h3 class='user-winners-announcement'>🏆 Winners will be announced soon...</h3>");
            return;
        }
    
        paginatedDates.forEach(function (draw_date) {
            let section = `<h2 class="user-winners-drawdate">🏆${draw_date}</h2><ul class="user-winners-winner-list">`;
            winnersData[draw_date].forEach(function (winner) {
                section += `<li>
                    <b>${winner.lottery_title}</b> - 
                    <span>${winner.username || "N/A"}</span> - 
                    Ticket <b class="winner-ticket">#${winner.ticket_number}</b>
                </li>`;
            });
            section += `</ul>`;
            winnersContainer.append(section);
        });
    }
    
    function renderuserPagination() {
        let paginationContainer = $("#user-winners-pagination");
        paginationContainer.empty();

        let totalPages = Math.ceil(drawDates.length / datesPerPage);
        if (totalPages <= 1) return;

        let paginationHTML = `<button class="prev-btn" ${currentPage === 1 ? "disabled" : ""}>« Prev</button>`;

        let pageNumbers = [];
        if (totalPages <= 3) {
            for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
        } else {
            if (currentPage <= 2) {
                pageNumbers = [1, 2, 3];
            
        } else if (currentPage === totalPages) {
            pageNumbers = [1, totalPages - 1, totalPages]; // First
            } else {
                pageNumbers = [currentPage - 1, currentPage, currentPage + 1];
            }
        }

        pageNumbers.forEach((page) => {
            paginationHTML += `<button class="page-btn ${page === currentPage ? "user-winners-active" : ""}" data-page="${page}">${page}</button>`;
        });

        if (totalPages > 3 && currentPage < totalPages - 1) {
            paginationHTML += `<span>...</span><button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        paginationHTML += `<button class="next-btn" ${currentPage === totalPages ? "disabled" : ""}>Next »</button>`;
        paginationContainer.append(paginationHTML);

        $(".prev-btn").click(() => { if (currentPage > 1) { currentPage--; renderuserWinners(); renderuserPagination(); } });
        $(".next-btn").click(() => { if (currentPage < totalPages) { currentPage++; renderuserWinners(); renderuserPagination(); } });
        $(".page-btn").click(function () { currentPage = parseInt($(this).data("page")); renderuserWinners(); renderuserPagination(); });
    }

    fetchWinnersusersdraw();
});
//winner.html--adminpanel module--views.py function def WinnersWallListView--#ID:LP-I159-end
//my_won_lottery_page.html--adminpanel module--views.py function def my_won_lottery--#ID:LP-I171-start
document.addEventListener("DOMContentLoaded", function () {
    if (typeof mywon_lottery === 'undefined') {
        return;  
    }
    fetch("/api/my-won-lottery/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken":mywon_lottery,
        },
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById("wonCardsContainer");
        container.innerHTML = "";

        if (data.length === 0) {
            container.innerHTML = "<p>No winning entries found.</p>";
            return;
        }

        data.forEach((item, index) => {
            const colors = ["my-won-lottery-card-blue", "my-won-lottery-card-lightblue", "my-won-lottery-card-purple"];
            const cardColor = colors[index % colors.length];
            const card = `
                <div class="my-won-lottery-card ${cardColor}">
                    <div class="my-won-lottery-prize-status">${item.prize_status}</div>
                    <div class="my-won-lottery-prize-number">Prize No:${item.prize_no || "N/A"}</div>
                    
                    <div class="my-won-lottery-prize-data">
                        <p><strong>Won Lottery:</strong> ${item.lottery_event}</p>
                        <p><strong>Won Ticket No:</strong> ${item.ticket_number}</p>
                        <p><strong>Comments:</strong> ${item.prize_comments || "-"}</p>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
    })
    .catch(error => console.error("Error fetching won lotteries:", error));
});
//my_won_lottery_page.html--adminpanel module--views.py function def my_won_lottery--#ID:LP-I171-end
//favorites.html--adminpanel module--views.py function def add_to_favorites--#ID:LP-I17-start
function toggleFavoriteSimilar(targetSlug) {
    fetch('/api/add_to_favorites/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "X-CSRFToken": add_csrftoken
        },
        body: JSON.stringify({ event_slug: targetSlug }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        updateFavoritesCount();
        fetchFavorites(); 
        fetchSimilarLotteryEvents(eventSlug);
        lottery_events_fetch();
        fetchCategoryLotteryEvents();
    })
    .catch(error => console.error('Error toggling favorite:', error));
}
//favorites.html--adminpanel module--views.py function def add_to_favorites--#ID:LP-I17-end






























