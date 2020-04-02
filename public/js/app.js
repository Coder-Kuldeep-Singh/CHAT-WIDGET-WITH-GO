(function() {
  "use strict";

  var pusher = new Pusher("6c9327496b3979aab10a", {
    authEndpoint: "/pusher/auth",
    cluster: "ap2",
    encrypted: true
  });

  let chat = {
    name: undefined,
    email: undefined,
    myChannel: undefined
  };

  const chatPage = $(document);
  const chatWindow = $(".chatbubble");
  const chatHeader = chatWindow.find(".unexpanded");
  const chatBody = chatWindow.find(".chat-window");

  let helpers = {
    ToggleChatWindow: function() {
      chatWindow.toggleClass("opened");
      chatHeader
        .find(".title")
        .text(
          chatWindow.hasClass("opened")
            ? "Minimize Chat Window"
            : "Chat with Support"
        );
    },

    ShowAppropriateChatDisplay: function() {
      chat.name
        ? helpers.ShowChatRoomDisplay()
        : helpers.ShowChatInitiationDisplay();
    },

    ShowChatInitiationDisplay: function() {
      chatBody.find(".chats").removeClass("active");
      chatBody.find(".login-screen").addClass("active");
    },

    ShowChatRoomDisplay: function() {
      chatBody.find(".chats").addClass("active");
      chatBody.find(".login-screen").removeClass("active");
      setTimeout(function() {
        chatBody.find(".loader-wrapper").hide();
        chatBody.find(".input, .messages").show();
      }, 2000);
    },

    NewChatMessage: function(message) {
      if (message !== undefined) {
        const messageClass = message.sender !== chat.email ? "support" : "user";
        chatBody.find("ul.messages").append(
          `<li class="clearfix message ${messageClass}">
                        <div class="sender">${message.name}</div>
                        <div class="message">${message.text}</div>
                    </li>`
        );
        chatBody.scrollTop(chatBody[0].scrollHeight);
      }
    },

    SendMessageToSupport: function(evt) {
      evt.preventDefault();
      let createdAt = new Date();
      createdAt = createdAt.toLocaleString();
      const message = $("#newMessage")
        .val()
        .trim();

      chat.myChannel.trigger("client-guest-new-message", {
        sender: chat.name,
        email: chat.email,
        text: message,
        createdAt: createdAt
      });

      helpers.NewChatMessage({
        text: message,
        name: chat.name,
        sender: chat.email
      });

      $("#newMessage").val("");
    },

    LogIntoChatSession: function(evt) {
      const name = $("#fullname")
        .val()
        .trim();
      const email = $("#email")
        .val()
        .trim()
        .toLowerCase();

      chatBody
        .find("#loginScreenForm input, #loginScreenForm button")
        .attr("disabled", true);

      if (
        name !== "" &&
        name.length >= 3 &&
        email !== "" &&
        email.length >= 5
      ) {
        axios
          .post("/new/customer", { name: name, email: email })
          .then(response => {
            chat.name = name;
            chat.email = email;
            console.log(response.data.email);
            chat.myChannel = pusher.subscribe("private-" + response.data.email);
            helpers.ShowAppropriateChatDisplay();
          });
      } else {
        alert("Enter a valid name and email.");
      }

      evt.preventDefault();
    }
  };

  pusher.bind("client-support-new-message", function(data) {
    helpers.NewChatMessage(data);
  });

  chatPage.ready(helpers.ShowAppropriateChatDisplay);
  chatHeader.on("click", helpers.ToggleChatWindow);

  chatBody.find("#loginScreenForm").on("submit", helpers.LogIntoChatSession);
  chatBody.find("#messageSupport").on("submit", helpers.SendMessageToSupport);
})();
