(function() {
  var pusher = new Pusher("6c9327496b3979aab10a", {
    authEndpoint: "/pusher/auth",
    cluster: "ap2",
    encrypted: true
  });

  let chat = {
    messages: [],
    currentRoom: "",
    currentChannel: "",
    subscribedChannels: [],
    subscribedUsers: []
  };

  var generalChannel = pusher.subscribe("one-to-many");

  const chatBody = $(document);
  const chatRoomsList = $("#rooms");
  const chatReplyMessage = $("#replyMessage");

  const helpers = {
    clearChatMessages: () => $("#chat-msgs").html(""),

    displayChatMessage: message => {
      if (message.email === chat.currentRoom) {
        $("#chat-msgs").prepend(
          `<tr>
                        <td>
                            <div class="sender">${message.sender} @ <span class="date">${message.createdAt}</span></div>
                            <div class="message">${message.text}</div>
                        </td>
                    </tr>`
        );
      }
    },

    loadChatRoom: evt => {
      chat.currentRoom = evt.target.dataset.roomId;
      chat.currentChannel = evt.target.dataset.channelId;
      if (chat.currentRoom !== undefined) {
        $(".response").show();
        $("#room-title").text(evt.target.dataset.roomId);
      }
      evt.preventDefault();
      helpers.clearChatMessages();
    },

    replyMessage: evt => {
      evt.preventDefault();
      let createdAt = new Date();
      createdAt = createdAt.toLocaleString();
      const message = $("#replyMessage input")
        .val()
        .trim();
      chat.subscribedChannels[chat.currentChannel].trigger(
        "client-support-new-message",
        {
          name: "Admin",
          email: chat.currentRoom,
          text: message,
          createdAt: createdAt
        }
      );

      helpers.displayChatMessage({
        email: chat.currentRoom,
        sender: "Support",
        text: message,
        createdAt: createdAt
      });

      $("#replyMessage input").val("");
    }
  };

  generalChannel.bind("new-customer", function(data) {
    chat.subscribedChannels.push(pusher.subscribe("private-" + data.email));
    chat.subscribedUsers.push(data);
    // render the new list of subscribed users and clear the former
    $("#rooms").html("");
    chat.subscribedUsers.forEach(function(user, index) {
      $("#rooms").append(
        `<li class="nav-item"><a data-room-id="${user.email}" data-channel-id="${index}" class="nav-link" href="#">${user.name}</a></li>`
      );
    });
  });

  pusher.bind("client-guest-new-message", function(data) {
    helpers.displayChatMessage(data);
  });

  chatReplyMessage.on("submit", helpers.replyMessage);
  chatRoomsList.on("click", "li", helpers.loadChatRoom);
})();
