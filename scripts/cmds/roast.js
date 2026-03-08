
const axios = require('axios');

module.exports = {
  config: {
    name: "roast",
    version: "1.0.2",
    author: "Rika",
    countDown: 5,
    role: 0,
    description: "Roast someone badly based on their message or profile.",
    category: "fun",
    guide: {
        en: "Reply to a message and type {pn}"
    }
  },

  onStart: async function ({ api, event, message, usersData }) {
    const { messageReply, senderID, mentions } = event;

    let victimID, victimMessage, victimName;

    if (messageReply) {
        victimID = messageReply.senderID;
        victimMessage = messageReply.body || "(Sent an attachment/image)";
        victimName = await usersData.getName(victimID) || "This person";
    } else if (Object.keys(mentions).length > 0) {
        victimID = Object.keys(mentions)[0];
        victimName = await usersData.getName(victimID) || "This person";
        victimMessage = "being a target of this command";
    } else {
        return message.reply("❌ [ RIKA ]\nPlease reply to a message or tag someone you want to roast!");
    }

    message.reaction("🔥", event.messageID);

    const getRoast = async (prompt) => {
        const apis = [
            `https://chatgpt.apinepdev.workers.dev/?question=${encodeURIComponent(prompt)}`,
            `https://api.shshank.tech/chatgpt?q=${encodeURIComponent(prompt)}`,
            `https://metakexbyneokex.fly.dev/chat?q=${encodeURIComponent(prompt)}`
        ];

        for (const url of apis) {
            try {
                const res = await axios.get(url, { timeout: 15000 });
                const roast = res.data.answer || res.data.content || res.data.reply || res.data.message;
                if (roast) return roast;
            } catch (e) {
                console.error(`Roast API fail: ${url}`, e.message);
            }
        }
        return null;
    };

    if (senderID == api.getCurrentUserID()) return;

    try {
      const prompt = `Roast this person named ${victimName} extremely badly, savagely, and creatively based on this context: "${victimMessage}". Be funny, mean, and use a savage tone. Respond with exactly 2 short lines of text. Respond with ONLY the roast text. No emojis except fire.`;
      
      const roast = await getRoast(prompt);

      if (roast) {
        return message.reply(`🔥 [ RIKA ROAST ] 🔥\n━━━━━━━━━━━━━━━━━━\n${roast}\n━━━━━━━━━━━━━━━━━━`);
      } else {
        return message.reply("💢 [ RIKA ]\nI tried to roast them but my brain is fried. Try again in a second!");
      }

    } catch (error) {
      console.error("Roast Final Error:", error);
      return message.reply("❌ Failed to generate a roast. They are surprisingly unroastable today.");
    }
  }
};
